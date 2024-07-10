import { create } from "zustand";
import useUserStore from "./userStore";


export const useGroupChatStore = create((set) => ({
    groupChatId: null,
    groupChat: null,
    isActiveGroupMember: true,
    members: [],
    admins: [],
    isUserAddMode: false,
    setIsUserAddMode: (mode) => {
        set({
            isUserAddMode: mode
        });
    },
    setIsActiveGroupMember: (userGroupStatus) => {
        set({
            isActiveGroupMember: userGroupStatus
        });
    },
    setMembers: (memberIds) => {
        const allUsers = useUserStore.getState().users;
        const currentUser = useUserStore.getState().currentUser;

        const allMembers = memberIds.map(prop => allUsers[prop]);
        allMembers.forEach((member) => {
            if (member.id === currentUser.id) {
                return "You"
            }
            return member.username
        })

        allMembers.sort((a, b) => a?.username.localeCompare(b?.username));

        set({
            members: allMembers
        });
    },
    setAdmins: (uids) => {
        set({
            admins: uids
        });
    },
    setGroupChat: (chat) => {
        set({
            groupChat: chat
        });
    },
    changeGroupChat: (chatId) => {
        return set({
            groupChatId: chatId
        })
    }
}));
