import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';

export const resolvers = {
  Query: {
    findProducts: (_: any, args: any, context: any) => {
      return [{ name: "Bored Ape", tokenId: "123" }]
    },
  },
};

const typeDefs = loadSchemaSync('./schema.graphql', {
  loaders: [new GraphQLFileLoader()],
});

const schemaRaw = makeExecutableSchema({
  typeDefs,
  resolvers,
});

export const schema = applyMiddleware(
  schemaRaw,
);
