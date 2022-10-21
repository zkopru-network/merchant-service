import fastify from 'fastify';
import mercurius, { IResolvers } from 'mercurius';
import { schema, buildContext } from './infra/graphql';
import resolvers from './infra/resolvers';
import './services/zkopru-service';

const app = fastify();

// Register GraphQL endpoint
app.register(mercurius, {
  schema,
  context: buildContext,
  resolvers: resolvers as IResolvers,
  graphiql: true,
});

export default app;
