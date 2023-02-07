import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import { mapSchema, getDirective, MapperKind } from '@graphql-tools/utils';
import { Knex } from 'knex';
import { FastifyRequest } from 'fastify';
import resolvers from './resolvers';
import authMiddleware from './auth-middleware';
import { IBlockchainService, ILogger } from '../../common/interfaces';
import errorHandlerMiddleware from './error-handler-middleware';

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

// Set mercurius type
declare module 'mercurius' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface MercuriusContext extends ReturnType<typeof buildContext> {}
}
