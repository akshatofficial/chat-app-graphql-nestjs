import { BadRequestException, Catch } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { ApolloError } from 'apollo-server-express';

@Catch(BadRequestException)
export class GraphQLErrorFilter implements GqlExceptionFilter {
  catch(exception: BadRequestException) {
    const response = exception.getResponse();

    console.log(response)

    if (typeof response === 'object') {
      throw new ApolloError('Validation Error', 'VALIDATION_ERROR', response);
    } else {
      throw new ApolloError('Bad Request');
    }
  }
}
