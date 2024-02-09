import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as fs from 'fs';
import { join } from 'path';

@Injectable()
export class UserService {
    constructor(private readonly prismaService: PrismaService) {}
    async updateUserProfile(userId:number, fullname: string, avatarUrl: string) {
        if(avatarUrl) {
            // This is the logic for deleting the old picture from the folder when user updates with the new one
            const oldUser = await this.prismaService.user.findUnique({
                where: {id: userId}
            });
            const oldAvatarUrl = oldUser.avatarUrl;
            if(!!oldAvatarUrl) {
                const fileName = oldAvatarUrl.split("/").pop();
                const filePath = join(__dirname, "..", "..", "public", "images", fileName);
                if(fs.existsSync(filePath)) fs.unlinkSync(filePath);
            }
            const updatedUser = await this.prismaService.user.update({
                where: {id: userId},
                data: {
                    fullname,
                    avatarUrl
                }
            })
            return updatedUser;
        }

        return await this.prismaService.user.update({
            where: {id: userId},
            data: {
                fullname
            }
        })
    }

    async searchUser(fullname: string, userId: number) {
        return this.prismaService.user.findMany({
            where: {
                fullname: {
                    contains: fullname
                },
                id: {
                    not: userId
                }
            }
        })
    }

    async getUsersOfChatrooms(chatroomId: number) {
        return this.prismaService.user.findMany({
            where: {
                chatrooms: {
                    // Atlest ek chatroom ho jiska id chatroomId ho 
                    some: {
                        id: chatroomId
                    }
                }
            }
        })
    }

    async getUser(userId: number) {
        return this.prismaService.user.findUnique({
          where: {
            id: userId,
          },
        });
      }
}