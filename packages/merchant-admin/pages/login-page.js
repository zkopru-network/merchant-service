import React from 'react';
import { useNavigate } from 'react-router';
import SIWEButton from '../components/siwe-button';
import { getAuthToken, setAuthToken, signIn } from '../data';

function LoginPage() {
  const navigate = useNavigate();

  // Redirect to homepage if token is present
  React.useEffect(() => {
    const authToken = getAuthToken();
    if (authToken) {
      navigate('/');
    }
  }, []);

  async function onSignIn({ message, signature }) {
    const authToken = await signIn({ message, signature });
    setAuthToken(authToken);
    navigate('/');
  }

  return (
    <div className="page login-page">
      <div>

        <div className="page-title">
          Zkopru Merchant Service
        </div>

        <div className="section login-form">
          <div className="section-title">
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
