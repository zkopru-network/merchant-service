import fastify from 'fastify';
import mercurius from 'mercurius';
import { schema, resolvers } from './core/graphql';
import './services/zkopru-service';

const app = fastify();

app.register(mercurius, {
  schema,
  resolvers,
  graphiql: true,
});

export default app;
