# Zkopru Merchant Service - Low Level Design

## Techstack

- NodeJS with GraphQL is used for the merchant server.
- Postgres database for storing product/order data.
- `merchant-admin` and `app` is built using React.

<br />

## Merchant Server Design

A variant/lighter version of **Domain Driven Design** is used to architect the codebase of merchant-server.
  - All actions user (merchant/customer) are build as use-cases - for example `createOrder`, `createProduct`.
  - All business entities are Domains and have validation login built into them.
  - Use-cases take Domain object as inputs, modify them and then pass on the to the repositories.
  - Any repository/service required for the use-case is injected in to them.
  - A generic interface BlockchainService is used to interact with the chain. ZkopruService is an implementation of this interface and it would be easy to create implementation for other protocol if required.
  - GraphQL API resolvers call the use-case after creating domain objects from the input and constructing repositories and services required. Resolvers also pass the output of a use-case to the response after any required transformation to DTO.

### Authentication
  - Authentication is merchant-service is powered by [EIP-4361: Sign In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361).
  - Merchant signs a message (from the merchant-admin app ideally) using their wallet (Metamask) and pass the message and signature to `signIn` API.
  - API verifies the signature validity and ensure its signed using the same private key configured for the merchant in the server. i.e Merchant would need to use the same private key for both Metamask and Merchant server.
  - Additionally server also verify if the message used to sign includes `zkopru merchant service`.
  - Upon successful verification, server issue a JWT token which should be included as `Authorization` header along with subsequent requests.
  - [SIWE](https://login.xyz/) libraries are used to implement EIP-4361 based login.
