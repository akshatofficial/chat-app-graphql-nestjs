import { gql } from '@apollo/client';

export const GET_USER_CHATROOMS = gql`
  query GetUserChatrooms($userId: Float!) {
    getUserChatrooms(userId: $userId) {
      id
      name
      messages {
        id
        content
        createdAt
        user {
          id
          fullname
        }
      }
      users {
        avatarUrl
        fullname
        id
        email
      }
    }
  }
`;
