import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import db from './db';
import resolvers from './resolvers';
import logger from '../core/logger';

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

export const buildContext = () => {
  return {
      db: db,
      logger: logger
  }
}

export type GraphQLContext = ReturnType<typeof buildContext>;