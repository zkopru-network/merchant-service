import {
  ApolloClient, InMemoryCache, createHttpLink,
} from '@apollo/client';
import { onError } from '@apollo/client/link/error';

const httpLink = createHttpLink({
  uri: 'http://localhost:8000/graphql',
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    // eslint-disable-next-line no-console
    graphQLErrors.forEach(({ message }) => console.error(`Error from API: ${message}`));
  }
  if (networkError) {
    // eslint-disable-next-line no-console
    console.error(`[Network error]: ${networkError}`);
  }
});

const client = new ApolloClient({
  link: errorLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default client;
