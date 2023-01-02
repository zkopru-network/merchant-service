import React from 'react';
import { useNavigate } from 'react-router';
import { useMutation, gql } from '@apollo/client';
import SIWEButton from '../components/siwe-button';
import { setAuthToken } from '../common/auth-helpers';

const signInQuery = gql`
  mutation signIn($message: String!, $signature: String!) {
    authToken: signIn(message: $message, signature: $signature)
  }
`;

function LoginPage() {
  const navigate = useNavigate();
  const [signInMutation] = useMutation(signInQuery);

  async function onSignIn({ message, signature }) {
    const { data } = await signInMutation({ variables: { message, signature } });
    setAuthToken(data.authToken);
    navigate('/');
  }

  return (
    <div className="page login-page">
      <div>

        <div className="page-title">
          Zkopru Merchant Service
        </div>

        <div className="page-description">
          A privacy friendly digital store for tokenized assets, powered by Zkopru. 
        </div>

        <div className="section">
          <div className="section__title">
            Sign in with Ethereum
          </div>
          <p>
            Zkopru Merchant Service use Ethereum account for authentication.
            <br />
            If you are the merchant of this store, you can login with the same account you configured in merchant server.
          </p>

          <SIWEButton onSignIn={({ message, signature }) => onSignIn({ message, signature })} />
        </div>

      </div>
    </div>
  );
}

export default LoginPage;
