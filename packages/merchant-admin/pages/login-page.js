import React from 'react';
import { useNavigate } from 'react-router';
import { useMutation, gql } from '@apollo/client';
import SIWEButton from '../components/siwe-button';

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
    window.localStorage.setItem('authToken', data.authToken);
    navigate('/');
  }

  return (
    <div className="page login-page">
      <div>

        <div className="page-title">
          Zkopru Merchant Service
        </div>

        <div className="login-form">
          <div className="title">
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
