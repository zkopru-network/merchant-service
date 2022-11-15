import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { Knex } from 'knex';
import { FastifyRequest } from 'fastify';
import resolvers from './resolvers';
import authMiddleware from './middleware/auth';
import { IBlockchainService, ILogger } from '../common/interfaces';
import { AuthenticationError, ValidationError } from '../common/error';

const typeDefs = loadSchemaSync('./schema.graphql', {
  loaders: [new GraphQLFileLoader()],
  assumeValidSDL: true,
});

const schemaRaw = makeExecutableSchema({
  typeDefs: [
    typeDefs,
    'directive @auth on FIELD_DEFINITION',
  ],
  resolvers,
});

const errorHandlerMiddleware = async (
  resolve: any,
  root: any,
  args: any,
  context: any,
  info: any,
) => {
  try {
    const result = await resolve(root, args, context, info);
    return result;
  } catch (error) {
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      return error;
    }
    return new Error('Unexpected error ocurred');
  }
};

const schemaWithMiddleware = applyMiddleware(schemaRaw, errorHandlerMiddleware, authMiddleware);

const schemaWithDirectives = mapSchema(schemaWithMiddleware, {
  // eslint-disable-next-line consistent-return
  [MapperKind.OBJECT_FIELD](fieldConfig) {
    const authDirective = getDirective(schemaWithMiddleware, fieldConfig, 'auth')?.[0];
    if (authDirective) {
      return {
        ...fieldConfig,
        async resolve(source, args, context, info) {
          context.requireAuth = true;
          const result = await fieldConfig.resolve(source, args, context, info);
          if (typeof result === 'string') {
            return result.toUpperCase();
          }
          return result;
        },
      };
    }
  },
});

export const schema = schemaWithDirectives;

export type GraphQLContext = {
  db: Knex,
  logger: ILogger,
  zkopruService: IBlockchainService,
  request: FastifyRequest,
  requireAuth: boolean,
}

export const buildContext = (request: FastifyRequest, logger: ILogger, zkopruService: IBlockchainService, db: Knex) => ({
  db,
  logger,
  zkopruService,
  request,
});
