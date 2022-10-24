import { loadSchemaSync } from '@graphql-tools/load';
import { GraphQLFileLoader } from '@graphql-tools/graphql-file-loader';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { applyMiddleware } from 'graphql-middleware';
import resolvers from './resolvers';

const typeDefs = loadSchemaSync('./schema.graphql', {
  loaders: [new GraphQLFileLoader()],
});

const schemaRaw = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// const errorHandlerMiddleware = async (
//   resolve: any,
//   root: any,
//   args: any,
//   context: any,
//   info: any
// ) => {
//   try {
//     const result = await resolve(root, args, context, info);
//     return result;
//   } catch (error) {
//     return "Unexpected error";
//   }
// };

export const schema = applyMiddleware(schemaRaw);
