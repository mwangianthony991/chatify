import { create } from "zustand";
import useUserStore from "./userStore";


const useChatStore = create((set) => ({
    chatId: null,
    user: null,
    isCurrentUserBlocked: false,
    isReceiverBlocked: false,
    isOnline: false,
    lastSeen: null,
    updateLastSeen: (dt) => set({ lastSeen: dt }),
    updateIsOnline: (status) => set({ isOnline: status }),
    changeChat: (chatId, user) => {
        const currentUser = useUserStore.getState().currentUser;

        // check if current user is blocked
        if (user.blocked.includes(currentUser.id)) {
            return set({
                chatId,
                user: null,
                isCurrentUserBlocked: true,
                isReceiverBlocked: false,
            });
        }

        // check if recipient is blocked
        else if (currentUser.blocked.includes(user.id)) {
            return set({
                chatId,
                user: user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: true,
            });
        } else {
            return set({
                chatId,
                user,
                isCurrentUserBlocked: false,
                isReceiverBlocked: false,
            });
        }
    },
    changeBlock: () => {
        set((state) => ({ ...state, isReceiverBlocked: !state.isReceiverBlocked }));
    },
    resetChat: () => {
        set({
            chatId: null,
            user: null,
            isCurrentUserBlocked: false,
            isReceiverBlocked: false,
        });
    },
}));

export default useChatStore;
