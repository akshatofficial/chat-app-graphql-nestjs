import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createWriteStream } from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ChatroomService {
    constructor(private readonly configService: ConfigService, 
        private readonly prisma: PrismaService) {}


    async getChatroom(id: string) {
        return await this.prisma.chatroom.findUnique({
            where: {
                id: parseInt(id)
            }
        })
    }    

    async createChatroom(name: string, sub: number) {
        const chatroom = await this.prisma.chatroom.findFirst({
            where: {
                name
            }
        });
        
        if(chatroom) throw new BadRequestException({name: `Chatroom with name ${name} already exists!`});

        return await this.prisma.chatroom.create({
            data: {
                name,
                users: {
                    connect: {
                        id: sub
                    }
                }
            }
        })
    }

    async addUsersToChatroom(chatroomId: number, userIds: number[]) {
        const chatroom = await this.prisma.chatroom.findUnique({
            where: {id: chatroomId},
        });
        if(!chatroom) throw new BadRequestException({chatroomId: "Chatroom do not exists!"});

        return await this.prisma.chatroom.update({
            where: {id: chatroomId},
            data: {
                users: {
                    connect: userIds.map((eachUserId) => ({id: eachUserId}))
                }
            },
            include: {
                users: true
            }
        })
    }

    async getUserChatrooms(userId: number) {
        return await this.prisma.chatroom.findMany({
            where: {users: {
                some: {
                    id: userId
                }
            }},
            include: {
                users: {
                    orderBy: {
                        createdAt: "asc"
                    }
                },
                messages: {
                    take: 1, //We only want the latest
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        })
    }

    async sendMessage(userId: number, message: string, chatroomId: number, imagePath: string) {
        return await this.prisma.message.create({
            data: {
                content: message,
                userId,
                chatroomId,
                imageUrl: imagePath
            },
            include: {
                user: true,
                chatroom: {
                    include: {users: true}
                }
            }
        })
    }

    async saveImage(image: {
        createReadStream: () => any;
        filename: string;
        mimetype: string;
    }) {
        const validImageTypes = ["image/jpeg", "image/png", "image/gif"];

        if(!validImageTypes.includes(image.mimetype))
            throw new BadRequestException({image: "Invalid image type"});
        
        const imageFileName = `${Date.now()}_${image.filename}`
        const imagePath = `${this.configService.get<string>("IMAGE_PATH")}/${imageFileName}`
        const readStream = image.createReadStream();
        const outputPath = `public/${imagePath}`;
        const writeStream = createWriteStream(outputPath);
        readStream.pipe(writeStream)

        await new Promise((resolve, reject) => {
            readStream.on("end", resolve);
            readStream.on("error", reject);
        })

        return imagePath;
    }

    async getMessagesForChatroom(chatroomId: number) {
        return await this.prisma.message.findMany({
            where: {
                chatroomId,
            },
            include: {
                chatroom: {
                    include: {
                        users: {
                            orderBy: {
                                createdAt: "desc"
                            }
                        }
                    }
                },
                user: true
            }
        })
    }

    async deleteChatroom(chatroomId: number) {
        return await this.prisma.message.delete({
            where: {id: chatroomId}
        })
    }
}
