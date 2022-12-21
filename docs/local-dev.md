# Local Development

Zkopru Merchant Service is comprised of four packages. It follows the monorepo pattern using yarn workspace.


- `merchant-server` : API server to server product details, and also accept orders
- `merchant-admin` : Admin UI to manage products, view orders, analytics.
- `store` : Customer facing store app where users can purchase assets available for sale.
- `test-data` : To generate sample contract and test data during development.

## Running packages locally

<br />

- Install dependencies

```sh
# in repo root
yarn
```

- Merchant service depend on some of Zkopru client libraries using node linked modules (`yarn link`).
  
  - @zkopru/client
  - @zkopru/babyjubjub
  - @zkopru/zk-wizard
  - @zkopru/transaction

  You should run `yarn link` inside each of these packages from the [zkopru core repo](https://github.com/zkopru-network/zkopru).


### merchant-server

`merchant-server` is a NodeJS serer build on top of fastify. GraphQL is used for the API.

- After installing dependencies run `yarn link-modules` to link Zkopru client libraries.
- Run `yarn dev` to start the server in development mode (default port 8000).
- Run tests using `yarn test`.
- Use `yarn build` to generate production ready build.
- `merchant-server` depends on postgres database. You can install it using docker (included in the docker-compose file in repo root).
- Postgres database can be initialized by running `yarn seed`.
- If you make changes to the graphql schema, you can use `yarn run graphql-codegen` to generate graphql types.

- Environment variables (can be configured in .env as well):
  ```sh
  # Postgres connection string
  DB_CONNECTION_STRING=postgresql://root:helloworld@127.0.0.1:5432/merchant-service

  # JSON RPC URL of ETH node where Zkopru is deployed
  WEBSOCKET_URL=ws://127.0.0.1:5000

  # Address of deployed Zkopru contract
  ZKOPRU_CONTRACT_ADDRESS=0x970e8f18ebfEa0B08810f33a5A40438b9530FBCF

  # Private key of merchant's wallet. Should have all the assets that would be listed for sale
  WALLET_PRIVATE_KEY=...

  # Secret used to generate JWT tokens for auth
  JWT_SECRET=s3cr3t
  ```

### merchant-admin

Merchant admin is a React app.

- Run `yarn start` to start the development mode (using Parcel) on port 4001.
- Use `yarn build` to generate production ready build.


- Environment variables (should be configured in .env as well):
  ```sh
  # URL of the merchant-server Graphql endpoint
  API_URL=http://localhost:8000/graphql
  ```

### store

Merchant admin is a React app.


- After installing dependencies run `yarn link-modules` to link Zkopru client libraries.
- Run `yarn start` to start the development mode (using Parcel) on port 4000.
- Use `yarn build` to generate production ready build.


- Environment variables (should be configured in .env as well):
  ```sh
  # URL of the merchant-server Graphql endpoint
  API_URL=http://localhost:8000/graphql

  # Zkopru (L2) public address of the Merchant
  MERCHANT_ADDRESS=....
  ```