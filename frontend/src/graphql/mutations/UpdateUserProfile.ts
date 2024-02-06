import { gql } from '@apollo/client';

export const UPDATE_PROFILE = gql`
mutation UpdateProfile(
    $fullname: String!
    $file: Upload,
) {
    updateUserProfile(fullname: $fullname, avatarFile: $file) {
        id
        fullname
        avatarUrl
    }
}
`;
