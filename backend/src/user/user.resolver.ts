import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
import { User } from './user.type';
import * as GraphQlUpload from 'graphql-upload/GraphQLUpload.js';
import { Request } from 'express';
import { UserService } from './user.service';
import {v4 as uuid} from 'uuid';
import { join } from 'path';
import { createWriteStream } from 'fs';

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) {}
    @Query(() => String)
    async hello() {
        return "hello"
    }

    private async generateUploadImageUrl(file: GraphQlUpload): Promise<string> {
        const {createReadStream, filename} = await file;
        const uniqueFilename = `${uuid()}_${filename}`;
        const imagePath = join(process.cwd(), "public", "images", uniqueFilename);
        const imageUrl = `${process.env.APP_URL}/images/${uniqueFilename}`;
        const readStream = createReadStream();
        readStream.pipe(createWriteStream(imagePath))
        return imageUrl;
    }   

    @UseGuards(GraphqlAuthGuard)
    @Mutation(() => User)
    async updateUserProfile(
        @Args("fullname") fullname:string,
        @Args("avatarFile", { type: () => GraphQlUpload, nullable: true }) avatarFile: GraphQlUpload.FileUpload,
        @Context() context: {req: Request}
    ){
        const imageUploadUrl = avatarFile ? await this.generateUploadImageUrl(avatarFile): null;
        const userId = context.req.user.sub;
        return await this.userService.updateUserProfile(userId, fullname, imageUploadUrl);
    }

    @UseGuards(GraphqlAuthGuard)
    @Query(() => [User])
    async searchUser(
        @Args("fullname") fullname: string,
        @Context() context: {req: Request}
    ) {
        return this.userService.searchUser(fullname, context.req.user.sub)
    }

    @UseGuards(GraphqlAuthGuard)
    @Query(() => [User])
    async getUsersOfChatrooms(
        @Args("chatroomId") chatroomId: number,
        @Context() context: {req: Request}
    ) {
        return this.userService.getUsersOfChatrooms(chatroomId)
    }
}
