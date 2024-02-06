import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ChatroomService } from './chatroom.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';
import { Request } from 'express';
import { UseFilters, UseGuards } from '@nestjs/common';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
import { GraphQLErrorFilter } from 'src/filters/custom-exception-filter';
import { Chatroom } from './chatroom.types';

@Resolver()
export class ChatroomResolver {
    constructor(private readonly chatroomService: ChatroomService, private readonly prismaService: PrismaService,
        private readonly userService: UserService) {}


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
