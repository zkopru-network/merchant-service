import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';

const provider = new ethers.providers.Web3Provider(window.ethereum);
const signer = provider.getSigner();

function createSiweMessage(address, statement) {
  const domain = window.location.host;
  const { origin } = window.location;

  const message = new SiweMessage({
    domain,
    address,
    statement,
    uri: origin,
    version: '1',
    chainId: '1',
  });
  return message.prepareMessage();
}

(async () => {
  const message = await createSiweMessage(await signer.getAddress(), 'Sign in with your Ethereum account to continue to Zkopru merchant service admin tool.');
  const signature = await signer.signMessage(message);

  console.log(await signer.getAddress());

  console.log(JSON.stringify(message));
  console.log(signature);
})();
