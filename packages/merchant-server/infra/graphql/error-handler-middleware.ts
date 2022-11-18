import { GraphQLFieldResolver, GraphQLResolveInfo } from 'graphql';
import { AuthenticationError, ValidationError } from '../../common/error';
import { GraphQLContext } from './graphql';

async function errorHandlerMiddleware(
  resolve: GraphQLFieldResolver<object, GraphQLContext>,
  root: object,
  args: object,
  context: GraphQLContext,
  info: GraphQLResolveInfo,
) {
  try {
    const result = await resolve(root, args, context, info);
    return result;
  } catch (error) {
    context.logger.error(error);
    if (error instanceof ValidationError || error instanceof AuthenticationError) {
      return error;
    }
    return new Error('Unexpected error ocurred');
  }
}

export default errorHandlerMiddleware;
