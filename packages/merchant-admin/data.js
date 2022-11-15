import axios from 'axios';

const API_URL = 'http://localhost:8000/graphql';

export function setAuthToken(token) {
  window.localStorage.setItem('authToken', token);
}

export function getAuthToken() {
  return window.localStorage.getItem('authToken');
}

export function removeAuthToken() {
  return window.localStorage.removeItem('authToken');
}

export async function queryGraphQL(config) {
  const token = getAuthToken();

  const client = axios.create({
    baseURL: API_URL,
    method: 'POST',
    headers: {
      ...token && { Authorization: `Bearer ${token}` },
    },
  });

  client.interceptors.response.use((response) => {
    if (response.status === 401) {
      removeAuthToken();
    }
    if (response.data.errors) {
      // eslint-disable-next-line no-console
      console.warn(`Error from GraphQL API ${JSON.stringify(response.data.errors)}`);
    }
    return response;
  }, (error) => {
    if (error.response.status === 401) {
      removeAuthToken();
    }
    Promise.reject(error);
  });

  const response = await client(config);

  return response.data?.data;
}

export async function signIn({ message, signature }) {
  const result = await queryGraphQL({
    data: {
      query: `
        mutation($message: String!, $signature: String!) {
          signIn(message: $message, signature: $signature)
        }
      `,
      variables: {
        message,
        signature,
      },
    },
  });

  return result.signIn;
}

export async function findOrders() {
  const result = await queryGraphQL({
    data: {
      query: `
        query {
          findOrders {
            id
            amount
            status
          }
        }
      `,
    },
  });

  return result.findOrders;
}

/**
 * @typedef Product
 * @param name {String}
 */

/**
 *
 * @returns Promise<string[]>
 */
export async function findProducts() {
  const result = await queryGraphQL({
    data: {
      query: `
        query {
          findProducts {
            id
            name
            price
            availableQuantity
            tokenStandard
            tokenId
          }
        }
      `,
    },
  });

  return result.findProducts;
}
