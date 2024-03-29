import { Args, Context, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';
import { ChatroomService } from './chatroom.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';
import { UseFilters, UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
import { GraphQLErrorFilter } from 'src/filters/custom-exception-filter';
import { Chatroom, Message } from './chatroom.types';
import {PubSub} from 'graphql-subscriptions';
import { User } from 'src/user/user.type';
import * as GraphQLUpload from 'graphql-upload/GraphQLUpload.js';

@Resolver()
export class ChatroomResolver {
    public pubSub: PubSub;
    constructor(private readonly chatroomService: ChatroomService, private readonly prismaService: PrismaService,
        private readonly userService: UserService) {
            this.pubSub = new PubSub();
        }

        @Subscription((returns) => Message, {
            nullable: true,
            resolve: (value) => value.newMessage
        })
        newMessage(
            @Args("chatroomId") chatroomId: number
        ){
            return this.pubSub.asyncIterator(`newMessage.${chatroomId}`)
        }

        @Subscription(() => User, {
            nullable: true,
            resolve: (value) => value.user,
            filter: (payload, variables) => {
                console.log(payload, variables, "from subscription")
                return payload.typingUserId !== variables.userId
            }
        })
        userStartedTyping(
            @Args("chatroomId") chatroomId: number,
            @Args("userId") userId: number
        ) {
            return this.pubSub.asyncIterator(`userStartedTyping.${chatroomId}`)
        }

        @Subscription(() => User, {
            nullable: true,
            resolve: (value) => value.user,
            filter: (payload, variables) => {
                console.log(payload, variables, "from subscription")
                return payload.typingUserId !== variables.userId
            }
        })
        userStoppedTyping(
            @Args("chatroomId") chatroomId: number,
            @Args("userId") userId: number
        ) {
            return this.pubSub.asyncIterator(`userStoppedTyping.${chatroomId}`)
        }

        @UseFilters(GraphQLErrorFilter)
        @UseGuards(GraphqlAuthGuard)
        @Mutation(() => User)
        async userStartedTypingMutation(
            @Args("chatroomId") chatroomId: number,
            @Context() context: {req: Request}
        ) {
            const user = await this.userService.getUser(context.req.user.sub)
            await this.pubSub.publish(`userStartedTyping.${chatroomId}`, {
                user,
                typingUserId: user.id
            })
            return user
        }

        @UseFilters(GraphQLErrorFilter)
        @UseGuards(GraphqlAuthGuard)
        @Mutation(() => User, {})
        async userStoppedTypingMutation(
            @Args("chatroomId") chatroomId: number,
            @Context() context: {req: Request}
        ) {
            const user = await this.userService.getUser(context.req.user.sub)
            await this.pubSub.publish(`userStoppedTyping.${chatroomId}`, {
                user,
                typingUserId: user.id
            })
            return user
        }


        @UseGuards(GraphqlAuthGuard)
        @Mutation(() => Message)
        async sendMessage(
            @Args("chatroomId") chatroomId: number,
            @Args("content") content: string,
            @Context() context: {req: Request},
            @Args("image", {type: () => GraphQLUpload, nullable: true}) image?: GraphQLUpload
        ) {
            let imagePath = null;

            if(image) imagePath = await this.chatroomService.saveImage(image)
            const newMessage = await this.chatroomService.sendMessage(
                context.req.user.sub,
                content,
                chatroomId,
                imagePath
            )
            await this.pubSub.publish(`newMessage.${chatroomId}`, {
                newMessage
            }).then((val) => console.log(val)).catch((e) => console.log(e));

            return newMessage;
        }

        @UseFilters(GraphQLErrorFilter)
        @UseGuards(GraphqlAuthGuard)
        @Mutation(() => Chatroom)
        async createChatroom(
            @Args("name") name: string,
            @Context() context: {req: Request}
        ){
            return this.chatroomService.createChatroom(name, context.req.user.sub)
        }

        @Mutation(() => Chatroom)
        async addUsersToChatroom(
            @Args("chatroomId") chatroomId: number,
            @Args("userIds", {type: () => [Number]}) userIds: number[]
        ) {
            return this.chatroomService.addUsersToChatroom(chatroomId, userIds)
        }

        @Query(() => [Chatroom])
        async getUserChatrooms(
            @Args("userId") userId: number,
        ) {
            return this.chatroomService.getUserChatrooms(userId)
        }

        @Mutation(() => Chatroom)
        async deleteChatroom(
            @Args("chatroomId") chatroomId: number,
        ) {
            await this.chatroomService.deleteChatroom(chatroomId)
            return "Chatroom deleted successfully";
        }


}
