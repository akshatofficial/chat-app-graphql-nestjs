import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import * as graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.js';
import { BadRequestException, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: [
      'Accept',
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "apollo-require-preflight"
    ],
    methods: ["GET", "PUT", "POST", "DELETE", "OPTIONS"]
  })

  app.use(cookieParser())
  app.use(graphqlUploadExpress({maxFileSize: 10000000000, maxFile: 1}));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    exceptionFactory: (errors) => { const completeError = errors.reduce((acc, err) => {
      acc[err.property] = Object.values(err.constraints).join(',')
      //Here above err.constraints is very much important as earlier I was just writing err and hence getting something like "[object Object],test,password,,[object Object] " in the client side.
      return acc;
    }, {}) 

    throw new BadRequestException(completeError);
  } 
  }));

  await app.listen(8080);
}
bootstrap();
