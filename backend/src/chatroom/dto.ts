import { Field } from "@nestjs/graphql";
import { IsArray, IsNotEmpty, IsString } from "class-validator";

export class CreateChatRoomDto {
    @Field()
    @IsString()
    @IsNotEmpty({message: "Chatroom name is required"})
    name: string;

    @Field(() => [String])
    @IsArray()
    userIds: string[]   
}