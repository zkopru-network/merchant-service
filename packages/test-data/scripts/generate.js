/* eslint-disable no-await-in-loop */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-console */
const hre = require('hardhat');
const { BigNumber } = require('ethers');
const fs = require('fs');
const { toWei, fromWei } = require('web3-utils');
const path = require('path');
const Zkopru = require('@zkopru/client').default;
const { ZkAccount } = require('@zkopru/client/dist/node');
const config = require('../config.json');
const erc20 = require('../artifacts/contracts/ERC20.sol/ERC20Factory.json');
const erc721 = require('../artifacts/contracts/ERC721.sol/ERC721Factory.json');

const sleep = (s) => new Promise((r) => { setTimeout(r, s); });

async function saveConfig(cnf) {
  fs.writeFileSync(path.join(__dirname, '../config.json'), JSON.stringify(cnf, null, 2));
}

async function deployERC20IfNotExists(name, ticker, supply) {
  if (config.deployedContracts[name]) {
    const contract = new hre.ethers.Contract(config.deployedContracts[name].address, erc20.abi, hre.ethers.provider);

    try {
      await contract.deployed();
      console.log(`${name} already deployed to: ${contract.address}`);
      return contract;
    } catch (error) {
      // Ignore
    }
  }

  const ERC20Factory = await hre.ethers.getContractFactory('ERC20Factory');
  const contract = await ERC20Factory.deploy(name, ticker, toWei(supply.toString(), 'ether'));
  await contract.deployed();
  console.log(`${name} deployed to: ${contract.address}`);
  config.deployedContracts[name] = {
    address: contract.address, type: 'ERC20', l1Balance: 0, l2Balance: 0,
  };
  saveConfig(config);

  return contract;
}

async function transferERC20ToMerchant(contract, amount) {
  const contractWithSigner = contract.connect(await hre.ethers.getSigner());
  const name = await contract.name();

  const currentBalance = await contractWithSigner.balanceOf(config.merchantAddress);

  console.log(`Current Balance of ${name}: `, currentBalance);

  if (!currentBalance.isZero()) {
    console.log(`Merchant wallet already contains ${currentBalance.toString()} ${name}`);
    config.deployedContracts[name].l1Balance = Number(fromWei(currentBalance.toString()));
    saveConfig(config);
    return;
  }

  await contractWithSigner.transfer(config.merchantAddress, toWei(amount, 'ether'));
  await contract.connect(await hre.ethers.getSigner(config.merchantAddress)).approve(config.zkopruAddress, toWei(amount, 'ether'));
  console.log(`Transferred ${amount} ${name} to merchant`);
  config.deployedContracts[name].l1Balance = amount;
  saveConfig(config);
}

async function deployERC721IfNotExists(name, ticker) {
  if (config.deployedContracts[name]) {
    const contract = new hre.ethers.Contract(config.deployedContracts[name].address, erc721.abi, hre.ethers.provider);

    try {
      await contract.deployed();
      console.log(`${name} already deployed to: ${contract.address}`);
      return contract;
    } catch (error) {
      // Ignore
    }
  }

  const ERC721Factory = await hre.ethers.getContractFactory('ERC721Factory');
  const contract = await ERC721Factory.deploy(name, ticker);
  await contract.deployed();
  config.deployedContracts[name] = {
    address: contract.address, type: 'ERC721', l1TokenIds: [], l2TokenIds: [],
  };
  saveConfig(config);
  console.log(`${name} deployed to: ${contract.address}`);

  return contract;
}

async function mintNFT(contract, tokenId) {
  const contractWithSigner = contract.connect(await hre.ethers.getSigner(config.merchantAddress));
  const name = await contractWithSigner.name();

  try {
    const currentOwner = await contractWithSigner.ownerOf(BigNumber.from(tokenId));
    if (currentOwner) {
      console.log(`${tokenId} for ${name} already minted`);
      return;
    }
  } catch (e) {
    // Ignore - unknown tokenId
  }

  await contractWithSigner.mint(config.merchantAddress, BigNumber.from(tokenId), 'https://token');
  await sleep(3000);

  await contractWithSigner.approve(config.zkopruAddress, BigNumber.from(tokenId));

  console.log(`Merchant minted ${name} - tokenId ${tokenId}`);
  config.deployedContracts[name].l1TokenIds.push(tokenId);
  saveConfig(config);
}

async function depositToZkopru() {
  const zkAccount = new ZkAccount(config.merchantPrivateKey);
  const node = Zkopru.Node({
    websocket: config.websocketUrl,
    address: config.zkopruAddress,
    accounts: [zkAccount],
    databaseName: 'zkopru.db',
  });
  await node.initNode();
  const wallet = new Zkopru.Wallet(node, config.merchantPrivateKey);

  await node.start();

  await new Promise((r) => {
    const interval = setInterval(() => {
      if (node.node.synchronizer.isSynced()) {
        clearInterval(interval);
        r();
      } else {
        console.log('Waiting for Zkopru node to sync');
      }
    }, 10000);
  });

  // const currentBalance = await wallet.wallet.getSpendableAmount();
  // console.log('Current L2 balance: ', await wallet.wallet.getSpendableAmount());

  for (const [name, tokenDetails] of Object.entries(config.deployedContracts)) {
    if (tokenDetails.type === 'ERC20') {
      wallet.wallet.addERC20(tokenDetails.address);

      const tokenRegistered = await node.node.layer1.upstream.methods.registeredERC20s(tokenDetails.address).call();

      if (!tokenRegistered) {
        const registerERC20Tx = await node.node.layer1.coordinator.methods
          .registerERC20(tokenDetails.address);

        await wallet.wallet.sendLayer1Tx({
          contract: config.zkopruAddress,
          tx: registerERC20Tx,
        });

        console.log(`Token ${name} registered on Zkopru`);
      } else {
        console.log(`Token ${name} already registered on Zkopru`);
      }

      const amountToTransfer = Number(tokenDetails.l1Balance) - Number(tokenDetails.l2Balance);
      const contract = new hre.ethers.Contract(tokenDetails.address, erc20.abi, hre.ethers.provider);

      if (amountToTransfer > 0) {
        await wallet.wallet.depositERC20(toWei('0', 'ether'), tokenDetails.address, toWei(amountToTransfer.toString(), 'ether'), toWei('0.1', 'ether'));
        tokenDetails.l2Balance += amountToTransfer;
        saveConfig(config);
        console.log(await contract.balanceOf(config.zkopruAddress));
        console.log(`${amountToTransfer} ${name} deposited to Zkopru`);
      } else {
        console.log(`${tokenDetails.l2Balance} ${name} already available in Zkopru`);
      }
    } else if (tokenDetails.type === 'ERC721') {
      wallet.wallet.addERC721(tokenDetails.address);

      const tokenRegistered = await node.node.layer1.upstream.methods.registeredERC721s(tokenDetails.address).call();

      if (!tokenRegistered) {
        const registerERC721Tx = await node.node.layer1.coordinator.methods
          .registerERC721(tokenDetails.address);

        await wallet.wallet.sendLayer1Tx({
          contract: config.zkopruAddress,
          tx: registerERC721Tx,
        });

        console.log(`Token ${name} registered on Zkopru`);
      } else {
        console.log(`Token ${name} already registered on Zkopru`);
      }

      for (const tokenId of tokenDetails.l1TokenIds) {
        const tokenExist = tokenDetails.l2TokenIds.includes(tokenId);
        if (!tokenExist) {
          await wallet.wallet.depositERC721(toWei('0', 'ether'), tokenDetails.address, tokenId, toWei('0.1', 'ether'));
          tokenDetails.l2TokenIds.push(tokenId);
          saveConfig(config);
          console.log(`${tokenId} from ${name} deposited to Zkopru`);
        } else {
          console.log(`${tokenId} from ${name} already available in Zkopru`);
        }
      }
    }
  }

  console.log('Deposit complete. Run the coordinator to include transactions in L2');
}

async function main() {
  console.log(`\n\n ${JSON.stringify(config, null, 2)} \n\n`);

  const mealToken = await deployERC20IfNotExists('MealToken', 'MEAL', 1000);
  await sleep(3000);
  const uniToken = await deployERC20IfNotExists('Uniswap', 'UNI', 500);
  await sleep(3000);
  await transferERC20ToMerchant(mealToken, '100');
  await sleep(3000);
  await transferERC20ToMerchant(uniToken, '50');
  await sleep(3000);

  const ticketNFT = await deployERC721IfNotExists('Worldcup Ticket', 'WC2022');
  await sleep(3000);
  const anonFrensNFT = await deployERC721IfNotExists('AnonFrens', 'ANF');
  await sleep(3000);
  await mintNFT(ticketNFT, 1001);
  await sleep(3000);
  await mintNFT(ticketNFT, 2001);
  await sleep(3000);
  await mintNFT(ticketNFT, 3001);
  await sleep(3000);
  await mintNFT(ticketNFT, 4001);
  await sleep(3000);

  await mintNFT(anonFrensNFT, 1557);
  await sleep(3000);
  await mintNFT(anonFrensNFT, 4844);
  await sleep(3000);
  await mintNFT(anonFrensNFT, 4337);
  await sleep(3000);

  await sleep(3000);
  await depositToZkopru();
  await sleep(3000);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
