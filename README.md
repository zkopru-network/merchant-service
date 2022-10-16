# Zkopru Merchant Service

A privacy-friendly online store for on-chain assets like NFTs on top of Zkopru network. 

Merchants can easily setup online store and list their items for sale. Customers will then be able to purchase items without revealing their wallet address. Note that assets for sale has to be moved to Zkopru network by th merchant.

<br />

## How it works

The core purchase flow is powered by the private [atomic swap](https://docs.zkopru.network/how-it-works/atomic-swap) feature in Zkopru. 

- Merchants setup the store and list the items for sale. Currently only ERC721 tokens are supported.
- NFTs listed for sale and their price is stored in the merchant's server, and not on the chain.
- When a customer visit the UI app, a Zkopru node is run in the browser and syncs with the network.
- App will connect to the server and loads the items available for sale. Server will also send information required to create the purchase transaction (UTXO hash).
- Customer will be able to purchase an item by creating a UTXO that match the one provided by the merchant.
- The transaction will also include the `swap` value which is the expected UTXO hash of the purchased item.
- UI app send the signed transaction (with the help of Zkopru extension), and the ZKSnark proof to the merchant server.
- Server creates a corresponding UTXO and the proof, and submit both transactions to a coordinator. 
- Coordinator includes both transactions in a block.
- The salt required for creating the UTXO can be generated in the app and passed to the merchant server along with the transaction.
- When the server and customers browser nodes sync fully, the swap would be complete.


### Example:

Assume Merchant want to sell a NFT for 1.5 ETH, and Alice is planning to purchase it.

- Assume Alice has 2 ETH in her wallet.
- She will spend her 2ETH note, and create two UTXOs
  - one for the merchant for 1.5ETH 
  - and another UTXO of 0.5ETH for herself. 
- She will also include a desired `swap` note in the transaction which would be the hash of UTXO of NFT with Alice as the owner.
- Merchant will create a transaction with spending the note for NFT and creating an output UTXO for the NFT with Alice as the recipient. The transaction will also include the swap note for UTXO corresponding to 1.5ETH to the merchant.

<br />

## Domain
- 
