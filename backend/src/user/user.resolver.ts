import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { GraphqlAuthGuard } from 'src/auth/graphql-auth.guard';
import { User } from './user.type';
import * as GraphQlUpload from 'graphql-upload/GraphQLUpload.js';
import { Request } from 'express';
import { UserService } from './user.service';
import {v4 as uuid} from 'uuid';
import { join } from 'path';

@Resolver()
export class UserResolver {
    constructor(private readonly userService: UserService) {}
    @Query(() => String)
    async hello() {
        return "hello"
    }

    private async generateUploadImageUrl(file: GraphQlUpload.FileUpload): Promise<string> {
        const {createReadStream, filename} = await file;
        const uniqueFilename = `${filename}_${uuid()}`;
        const imagePath = join(process.cwd(), "public", uniqueFilename);
        const imageUrl = `${process.env.APP_URL}/${uniqueFilename}`;
        const readStream = createReadStream();
        readStream.pipe(createReadStream(imagePath))
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
}
