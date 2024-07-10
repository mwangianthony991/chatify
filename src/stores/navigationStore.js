import { create } from 'zustand';


export const useNavigationStore = create((set)=> ({
    currentPage: "chats",
    chatUserDetailsIsToggled: false,
    groupChatDetailsIsToggled: false,
    setCurrentPage: (page) => {
        set({ currentPage: page })
    },
    toggleChatUserDetails: () => set((state) => ({ 
        chatUserDetailsIsToggled: !state.chatUserDetailsIsToggled,
        groupChatDetailsIsToggled: false
    })),
    toggleGroupChatDetails: () => set((state) => ({
        chatUserDetailsIsToggled: false,
        groupChatDetailsIsToggled: !state.groupChatDetailsIsToggled,
    })),
}));
