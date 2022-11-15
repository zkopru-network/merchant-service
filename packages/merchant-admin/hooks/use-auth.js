import React from 'react';
import { useNavigate } from 'react-router';
import { useMutation, gql } from '@apollo/client';

const signInQuery = gql`
  mutation signIn($message: String!, $signature: String!) {
    authToken: signIn(message: $message, signature: $signature)
  }
`;

function setAuthToken(token) {
  window.localStorage.setItem('authToken', token);
}

function getAuthToken() {
  return window.localStorage.getItem('authToken');
}

function removeAuthToken() {
  return window.localStorage.removeItem('authToken');
}

export default function useAuth() {
  
  const navigate = useNavigate();

  const [signInMutation, { data, loading, error }] = useMutation(signInQuery);

  return {
    signIn(message, signature) {
      signInMutation({
        variables: { }
      })
    }
    
  }

}