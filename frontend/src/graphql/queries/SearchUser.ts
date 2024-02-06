import { gql } from '@apollo/client';

export const SEARCH_USER = gql`
  query SearchUser($fullname: String!) {
    searchUser(fullname: $fullname) {
      id
      fullname
      email
    }
  }
`;
