import { SiweMessage } from 'siwe';
import JWT from 'jsonwebtoken';
import { ILogger, IBlockchainService } from '../common/interfaces';
import { AuthenticationError } from '../common/error';

type SignInInput = {
  message: string;
  signature: string;
};

type Context = {
  logger: ILogger;
  blockchainService: IBlockchainService;
};

export default async function signInUseCase(input: SignInInput, context: Context) : Promise<string> {
  let siweFields;
  try {
    const siweMessage = new SiweMessage(input.message);
    siweFields = await siweMessage.validate(input.signature);
  } catch (error) {
    throw new AuthenticationError(`Sign in with ethereum failed: ${error.message}`);
  }

  // Verify its merchant trying to sign in
  if (siweFields.address !== context.blockchainService.getWalletAddress()) {
    throw new AuthenticationError('Account used to sign in is not same as the configured merchant account.');
  }

  // Ensure the signature was made for merchant service
  if (!siweFields.statement.toLowerCase().includes('zkopru merchant service')) {
    throw new AuthenticationError("Sign in message does not include 'zkopru merchant service'");
  }

  // 1 Day validity if not specified
  const expirationTime = siweFields.expirationTime || new Date().getTime() + (24 * 60 * 60 * 1000);

  // Generate a JWT token with address in payload
  const authToken = JWT.sign({
    address: siweFields.address,
  }, process.env.JWT_SECRET, {
    expiresIn: expirationTime,
  });

  return authToken;
}
