import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { GraphQLModule } from '@nestjs/graphql';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ApolloDriver } from '@nestjs/apollo';
import { join } from 'path';
import { RedisPubSub } from 'graphql-redis-subscriptions';
import { min } from 'class-validator';
import { TokenService } from './token/token.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ChatroomModule } from './chatroom/chatroom.module';
import { LiveChatroomModule } from './live-chatroom/live-chatroom.module';

const pubsub = new RedisPubSub({
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: parseInt(process.env.REDIS_PORT || "6379", 10),
    retryStrategy: (times) => {
      return Math.min(times * 50, 2000)
    }
  }
})

@Module({
  imports: [AuthModule, UserModule, 
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "..", "public"),
      serveRoot: "/"
    }),
    GraphQLModule.forRootAsync({
      imports: [ConfigModule, AppModule],
      inject: [ConfigService],
      driver: ApolloDriver,
      useFactory: async(tokenService: TokenService) => {
        return { 
          playground: true,
          autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
          sortSchema: true,
          //part of ws-resolve-from-frontend
          installSubscriptionHandlers: true,
          subscriptions: {
            'graphql-ws': true,
            'subscriptions-transport-ws': true
          },
          onConnect: (connectionParams: any) => {
            const token = tokenService.extractToken(connectionParams);
            if(!token) throw new Error("Token not found");
            const user = tokenService.validateToken(token);
            if(!user) throw new Error("Invalid token");

            return { user }
          },
          context: ({req, res, connection}) => {
            if(connection)
              return {req, res, user: connection.context.user, pubsub}
            return {req, res}
          }
        }
      }
    }),
    ConfigModule.forRoot({
      isGlobal: true
    }),
    ChatroomModule,
    LiveChatroomModule
  ],
  controllers: [AppController],
  providers: [AppService, TokenService],
})
export class AppModule {}
