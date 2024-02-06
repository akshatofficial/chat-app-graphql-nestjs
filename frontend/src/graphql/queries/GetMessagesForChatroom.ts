import { gql } from "@apollo/client";

export const GET_MESSAGES_FOR_CHATROOM = gql`
    query GetMessagesForChatroom($chatroomId: Float!) {
        getMessagesForChatroom(chatroomId: $chatroomId) {
            id
            content
            imageUrl
            createdAt
            user {
                id
                fullname
                avatarUrl
                email
            }
            chatroom {
                users {
                    id
                    fullname
                    avatarUrl
                    email
                }
                id
                name
            }
        }
    }
`