import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { Redis } from 'ioredis';

@Injectable()
export class LiveChatroomService {
    private redisClient: Redis;

    constructor() {
         this.redisClient = new Redis({
            host: process.env.REDIS_HOST || "localhost",
            port: parseInt(process.env.REDIS_PORT || "6379", 10)
         })
    }

    async addUsersToLiveChatroom(chatroomId: number, user: User): Promise<void> {
        const existingUsersInLiveChatroom = await this.getExistingUsersInLiveChatroom(chatroomId);
        
        const existingUser = existingUsersInLiveChatroom.find((liveUser) => liveUser.id === user.id)

        if(existingUser) return;

        await this.redisClient.sadd(
            `liveUsers:chatroom:${chatroomId}`,
            JSON.stringify(user)
        )
    }

    async removeLiveUsersFromChatroom(chatroomId: number, user: User): Promise<void> {
        await this.redisClient.srem(`liveUsers:chatroom:${chatroomId}`,
        JSON.stringify(user)).
        catch((err) => console.log("removeLiveUsersFromChatroom err", err)).
        then((res) => console.log("removeLiveUsersFromChatroom res", res))
    }

    async getExistingUsersInLiveChatroom(chatroomId:number): Promise<User[]> {
        const users = await this.redisClient.smembers(`liveUsers:chatroom:${chatroomId}`);

        return users.map((user) => JSON.parse(user));
    }
}
