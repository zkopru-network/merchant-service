/* eslint-disable import/no-unresolved */
/* eslint-disable import/no-extraneous-dependencies */
import Zkopru from '@zkopru/client';
import { ZkopruNode } from '@zkopru/client/dist/node';
import { Note, Utxo } from '@zkopru/transaction';
import { Fp } from '@zkopru/babyjubjub';
import { toWei } from 'web3-utils';

// Mocked constants and helpers for all tests
const mockCoordinatorUrl = 'https://mock-coordinator';
export const merchantPrivateKey = '0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1';

export async function getMockedZkopru() : Promise<ZkopruNode> {
  const node = {
    node: {
      db: {
        transaction: async () => ({}),
        update: async () => ({}),
      },
      layer1: {
        address: 'https://mock',
      },
      tracker: {
        addAccounts: async () => ({}),
      },
      layer2: {
        grove: {
          utxoTree: {
            merkleProof: () => ({
              siblings: [] as object[],
              index: Fp.from(0),
              root: Fp.from(0),
            }),
          },
        },
        snarkVerifier: {
          verifyTx: async () => true,
        },
      },
      running: true,
      blockCache: {},
      blockProcessor: {},
      synchronizer: {},
    },
  } as unknown as ZkopruNode;

  return node;
}

export function getMockedZkopruWallet({
  node, privateKey = merchantPrivateKey, ethBalance, erc20Balance, erc721TokenIds, erc20TokenAddress, erc721TokenAddress,
}: { node: ZkopruNode, ethBalance?: number, privateKey?: string, erc20Balance?: number, erc721TokenIds?: string[], erc20TokenAddress?: string, erc721TokenAddress?: string }) {
  const wallet = new Zkopru.Wallet(node, privateKey);

  // Override activeCoordinatorUrl to return mock url
  wallet.wallet.coordinatorManager.activeCoordinatorUrl = async () => mockCoordinatorUrl;

  // Create Utxos with given balances
  const utxoEth = ethBalance && Utxo.from(new Note(wallet.wallet.account.zkAddress, Fp.from('123'), {
    eth: Fp.from(toWei(ethBalance.toString())),
    tokenAddr: Fp.from('0x0000000000000000000000000000000000000000'),
    erc20Amount: Fp.from('0'),
    nft: Fp.from('0'),
  }));
  if (utxoEth) utxoEth.nullifier = () => Fp.from(1);

  const utxoErc20 = erc20TokenAddress && erc20Balance && Utxo.from(new Note(wallet.wallet.account.zkAddress, Fp.from('123'), {
    eth: Fp.from('0'),
    tokenAddr: Fp.from(erc20TokenAddress),
    erc20Amount: Fp.from(toWei(erc20Balance.toString())),
    nft: Fp.from('0'),
  }));
  if (utxoErc20) utxoErc20.nullifier = () => Fp.from(1);

  const utxoErc721s: Utxo[] = [];
  if (erc721TokenAddress && erc721TokenIds?.length) {
    erc721TokenIds.forEach((tokenId) => {
      const ut = Utxo.from(new Note(wallet.wallet.account.zkAddress, Fp.from('123'), {
        eth: Fp.from('0'),
        tokenAddr: Fp.from(erc721TokenAddress),
        erc20Amount: Fp.from('0'),
        nft: Fp.from(tokenId),
      }));
      if (ut) ut.nullifier = () => Fp.from(1);

      utxoErc721s.push(ut);
    });
  }

  // Override wallet getSpendables method to return the created Utxo instead of querying DB
  wallet.wallet.getSpendables = async () => [
    utxoEth,
    utxoErc20,
    ...utxoErc721s,
  ].filter(Boolean);

  return wallet;
}
