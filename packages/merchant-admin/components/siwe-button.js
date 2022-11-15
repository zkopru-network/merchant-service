import { ethers } from 'ethers';
import { SiweMessage } from 'siwe';
import loginButton from '../assets/siwe.png';

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

function SIWEButton(props) {
  const { onSignIn } = props;

  async function onLoginClick() {
    const message = await createSiweMessage(await signer.getAddress(), 'Sign in with your Ethereum account to continue to Zkopru merchant service admin tool.');
    const signature = await signer.signMessage(message);
    onSignIn({ message, signature });
  }

  return (
    <button
      className="siwe-button"
      type="button"
      onClick={onLoginClick}
    >
      <img alt="Sign in with Ethereum" src={loginButton} />
    </button>
  );
}

export default SIWEButton;
