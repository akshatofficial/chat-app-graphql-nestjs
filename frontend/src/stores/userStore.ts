import {create} from 'zustand';
import {persist} from 'zustand/middleware'
import {User} from '../gql/graphql';

interface UserState {
    id: number | undefined
    fullname: string,
    avatarUrl: string | null
    email?: string
    updateProfileImage: (image: string) => void
    updateUsername: (name: string) => void
    setUser: (user: User) => void
}

export const useUserStore = create<UserState>() (
    persist(
        (set) => ({
            id: undefined,
            fullname: "",
            avatarUrl: null,
            email: "",
            updateProfileImage: (image: string) => set({avatarUrl: image}),
            updateUsername: (name: string) => set({fullname: name}),
            setUser: (user: User) => set({
                id: user.id || undefined,
                fullname: user.fullname,
                avatarUrl: user.avatarUrl,
                email: user.email
            })
        }),
        {
            name: "user-storage"
        }
    )
)