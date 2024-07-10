import { create } from 'zustand';


export const useGroupAddStore = create((set) => ({
    currentFormStep: 0,
    groupUsers: [],
    setCurrentFormStep: (step) => set({ currentFormStep: step }),
    setGroupUsers: (userList) => {
        set({ groupUsers: userList })
    },
}));
