import { Args, Context, Mutation, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { LiveChatroomService } from './live-chatroom.service';
import { UserService } from 'src/user/user.service';
import { User } from 'src/user/user.type';
import { UseFilters, UseGuards } from '@nestjs/common';
import { GraphQLErrorFilter } from 'src/filters/custom-exception-filter';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
import { Request } from 'express';

@Resolver()
export class LiveChatroomResolver {
    private pubSub: PubSub;
    constructor(
        private readonly liveChatroomService: LiveChatroomService,
        private readonly userService: UserService) {
            this.pubSub = new PubSub();
        }

        @Subscription(() => [User], {
            nullable: true,
            resolve: (value) => value.liveUsers,
            filter: (payload, variables) => {
                return payload.chatroomId === variables.chatroomId
            },
        })
        liveUsersInChatroom(@Args("chatroomId") chatroomId: number) {
            return this.pubSub.asyncIterator(`liveUsersInChatroom.${chatroomId}`)
        }

        @UseFilters(GraphQLErrorFilter)
        @UseGuards(GraphqlAuthGuard)
        @Mutation(() => Boolean)
        async enterChatroom(
            @Args('chatroomId') chatroomId: number,
            @Context() context: { req: Request },
        ) {
            const user = await this.userService.getUser(context.req.user.sub)
            await this.liveChatroomService.addUsersToLiveChatroom(chatroomId, user);
            const liveUsers = await this.liveChatroomService.getExistingUsersInLiveChatroom(chatroomId)
            .catch((err) => console.log('getExistingUsersInLiveChatroom', err));

            await this.pubSub.publish(`liveUsersInChatroom.${chatroomId}`, {
                liveUsers, 
                chatroomId
            }).catch((err) => console.log("PubSub Error", err));
            return true;
        }

        @UseFilters(GraphQLErrorFilter)
        @UseGuards(GraphqlAuthGuard)
        @Mutation(() => Boolean)
        async leaveChatroom(
            @Args('chatroomId') chatroomId: number,
            @Context() context: { req: Request },
        ) {
            const user = await this.userService.getUser(context.req.user.sub)
            await this.liveChatroomService.removeLiveUsersFromChatroom(chatroomId, user);
            const liveUsers = await this.liveChatroomService.getExistingUsersInLiveChatroom(chatroomId)
            .catch((err) => console.log('getExistingUsersInLiveChatroom', err));

            await this.pubSub.publish(`liveUsersInChatroom.${chatroomId}`, {
                liveUsers, 
                chatroomId
            }).catch((err) => console.log("PubSub Error", err));
            return true;
        }
}
