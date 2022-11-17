import {
  ApolloClient, InMemoryCache, createHttpLink,
} from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getAuthToken, removeAuthToken } from './auth-helpers';

const httpLink = createHttpLink({
  uri: 'http://localhost:8000/graphql',
});

const authLink = setContext((_, { headers }) => {
  const token = getAuthToken();
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    // eslint-disable-next-line no-console
    graphQLErrors.forEach(({ message }) => console.error(`Error from API: ${message}`));
  }
  if (networkError) {
    // eslint-disable-next-line no-console
    console.error(`[Network error]: ${networkError}`);

    // Clear auth token on 401 responses
    if (networkError.statusCode === 401) {
      removeAuthToken();
      window.location.reload(); // Reload to trigger a redirect to login page
    }
  }
});

const client = new ApolloClient({
  link: authLink.concat(errorLink).concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
