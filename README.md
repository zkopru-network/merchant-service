# Zkopru Merchant Service

A privacy-friendly online store for on-chain assets like NFTs, powered by the Zkopru network. 

Merchants can easily setup online store and list their assets for sale. Customers will then be able to purchase assets without revealing their wallet details. 

<br />

## How it works

The core purchase flow is powered by the private [atomic swap](https://docs.zkopru.network/how-it-works/atomic-swap) feature in Zkopru. 


### Example:

Suppose a merchant want to sell a NFT for 1.5 ETH, and Alice is planning to purchase it.

- Assume Alice has 2 ETH in her wallet.
- She will create a Zkopru L2 transaction that spend her 2ETH note, and create two output notes:
  - one for the merchant for 1.5ETH 
  - and another UTXO of 0.5ETH for herself. 
- Merchant will create a transaction with spending the note for NFT and creating an output UTXO for the NFT with Alice as the owner.
- Both the transactions will include a desired `swap` note which is the UTXO hash of the asset each party would be receiving. This is required for a successful atomic swap in the network.

### Detailed flow

- Merchants setup a server that store assets for sale and the inventory in a database. Server will connect to a Zkopru node and would be configured with merchant's wallet.
- `Merchant Admin` app can be used to manage the inventory and see the orders.
- Customers use the frontend `app` to view the products (tokens) available for purchase, including their price and metadata.
- Customer create a transaction to transfer the `ETH` required to purchase the item, and send the transaction to the merchant server.
- Merchant server create a transaction to transfer the asset to the customer, and send both the transactions to a coordinator.
- Both customer and merchant will have the `swap` field in the transaction which is the expected UTXO hash of asset bought/sold.
- `salt` required to generate the UTXO hash for the `swap` key in the transaction can be generated in the UI app and passed to the server along with the transaction.
- Coordinator includes both transactions received from the merchant in one block.

### Notes / Assumptions

- Assets for sale has to be moved to Zkopru network by th merchant.
- Customer facing app interact with Zkopru network using the browser extension.
- The service only supports one store at the moment (i.e no multi-tenancy).
- Only ERC721 and ERC20 tokens are supported.
- One order can have only one product (one token), but can have any number of quantity for the same item (for ERC20 tokens)
- Ony ETH is supported as a currency for now

<br />

## Domain Terms
- **Merchant**: Vendor who sells the product.
- **Product**: Item/asset that is available for sale. All products are tokens in either ERC20 or ERC721 format. To keep this simple quantity available (stock/inventory) for sale is also stores as part of the product.
- **Order**: Transaction corresponding to the purchase of an item.

<br />

## Docs
- [Architecture](./docs/architecture.md)
- [Low Level Design](./docs/low-level-design.md)