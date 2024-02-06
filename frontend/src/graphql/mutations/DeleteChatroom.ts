import { gql } from "@apollo/client";

export const DELETE_CHATROOM = gql`
    mutation DeleteChatroom($chatroomId: String!) {
        deleteChatroom(chatroomId: $chatroomId)
    } 
`