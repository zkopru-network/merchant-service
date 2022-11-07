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
  - Authentication is merchant-service is powered by merchant's ETH wallet.
  - Merchant signs a message and pass the message and signature to the `signIn` API. API check if the message was signed using the same private key stored in the merchant server.
  - If the signature is valid a JWT is issues from merchant service which can be used as `Authorization` bearer header in subsequent API request.
  - A new signature is not required for all API request, which will also improve the UX.
  - The message for signing can be the timestamp at the moment, and the server can also validate the signature was not made before a threshold amount of seconds. This would prevent misuse of (message-signature) pair if they get compromised in the future.
  - To reiterate, when the merchant want to sign in to the `merchant-admin` tool (browser app), they would need to sign a message using Metamask (or equivalent) that has the same private key used in the the merchant server (from which L2 account is also derived).
