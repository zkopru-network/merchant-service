import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';
import JWT from 'jsonwebtoken';
import { AuthenticationError } from '../../common/error';
import { GraphQLContext } from '../graphql';

async function authMiddleware(
  resolve: GraphQLFieldResolver<object, GraphQLContext>,
  root: object,
  args: object,
  context: GraphQLContext,
  info: GraphQLResolveInfo,
) {
  const { request } = context;

  // Verify JWT token
  if (context.requireAuth) {
    const authHeader = request.headers.authorization as string;
    const bearerToken = authHeader?.split('Bearer ')[1];

    if (!bearerToken) {
      throw new AuthenticationError('No bearer token found in request');
    }

    try {
      JWT.verify(bearerToken, process.env.JWT_SECRET);
    } catch {
      throw new AuthenticationError('Auth token validation failed');
    }
  }

  const result = await resolve(root, args, context, info);
  return result;
}

export default authMiddleware;
