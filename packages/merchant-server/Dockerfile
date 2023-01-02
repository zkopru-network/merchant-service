FROM node:16-alpine

RUN apk add git

WORKDIR /app

RUN git clone https://github.com/zkopru-network/zkopru.git
RUN (cd zkopru && yarn && yarn build)
RUN (cd zkopru/packages/client && yarn link)
RUN (cd zkopru/packages/transaction && yarn link)
RUN (cd zkopru/packages/babyjubjub && yarn link)
RUN (cd zkopru/packages/zk-wizard && yarn link)

COPY package*.json ./
COPY tsconfig.json ./

RUN yarn link-modules
RUN yarn
RUN yarn add typescript

# copy source code to /app/src folder
COPY . .

RUN yarn build

EXPOSE 8080

CMD [ "node", "./dist" ]