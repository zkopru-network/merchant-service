export function setAuthToken(token) {
  window.localStorage.setItem('authToken', token);
}

export function getAuthToken() {
  return window.localStorage.getItem('authToken');
}

export function removeAuthToken() {
  window.localStorage.clear('authToken');
}
