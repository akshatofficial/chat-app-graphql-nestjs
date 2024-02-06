import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface GeneralStore {
  isProfileSettingsModalOpen: boolean;
  isLoginModalOpen: boolean;
  isCreateRoomModalOpen: boolean;
  toggleProfileSettingsModal: () => void;
  toggleLoginModal: () => void;
  toggleCreateRoomModal: () => void;
}

export const useGeneralStore = create<GeneralStore>()(
  persist(
    (set) => ({
      isProfileSettingsModalOpen: false,
      isLoginModalOpen: false,
      isCreateRoomModalOpen: false,
      toggleCreateRoomModal: () => set((state) => ({ isCreateRoomModalOpen: !state.isCreateRoomModalOpen })),
      toggleLoginModal: () => set((state) => ({ isLoginModalOpen: !state.isLoginModalOpen })),
      toggleProfileSettingsModal: () =>
        set((state) => ({ isProfileSettingsModalOpen: !state.isProfileSettingsModalOpen })),
    }),

    { name: 'general-storage' }
  )
);
