/* eslint-disable no-alert */

export default function useZkopru() {
  window.addEventListener('ZKOPRU#PROVIDER_CONNECTED', async () => {
    alert('connected');
  });

  async function connect() {
    if (!window.zkopru) {
      alert('Zkopru extension is missing.');
    }

    if (!window.zkopru.connected) {
      await window.zkopru.connect();
    }
  }

  async function generateSwapTransaction() {
    await connect();

    // Todo: exec swap

    return '';
  }

  return {
    connect,
    zkopru: window.zkopru,
    generateSwapTransaction,
  };
}
