import { Module } from '@nestjs/common';
import { LiveChatroomService } from './live-chatroom.service';
import { LiveChatroomResolver } from './live-chatroom.resolver';

@Module({
  providers: [LiveChatroomService, LiveChatroomResolver]
})
export class LiveChatroomModule {}
