import { create } from 'zustand';
import { 
    collection,
    doc,
    documentId,
    getDoc,
    getDocs,
    query,
    where
} from 'firebase/firestore';
import { db } from '../utils/firebase';


const useUserStore = create((set) => ({
    currentUser: null,
    isLoading: true,
    users: [],
    activeGroups: [],
    updateUserDetails: (updatedUser) => {
        return set({ currentUser: updatedUser })
    },
    fetchUserDetails: async (uid) => {
        if (!uid)
            return set({ currentUser: null, isLoading: false })

        try {
            const docRef = doc(db, "users", uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                set({ currentUser: docSnap.data(), isLoading: false });
            } else {
                set({ currentUser: null, isLoading: false });
            }
        } catch(err) {
            console.log(err)
            return set({ currentUser: null, isLoading: false });
        }
    },
    fetchAllUsers: async () => {
        await getDocs(collection(db, "users"))
            .then((snapShot) => {
                const usersData = {};

                snapShot.docs.map((doc) => {
                    let data = doc.data();
                    let id = data.id;
                    usersData[[id]] = data;

                    return {
                        [id]: data
                    }
                })
                return set({ users: usersData })
            })
    },
    fetchActiveGroups: async (uid) => {
        if (!uid) {
            return set ({ activeGroups: [] })
        }

        const userGroupsRef = doc(db, "usergroups", uid);
        const userGroupsSnap = await getDoc(userGroupsRef);
        const allGroups = userGroupsSnap.data()?.groupChats || [];

        if ((!allGroups) || (allGroups.length === 0)) {
            return set ({ activeGroups: [] })
        }

        const activeGroupIds = [];

        for (let i = 0; i < allGroups.length; i++) {
            if (allGroups[i]?.isActive === true) {
                activeGroupIds.push(allGroups[i].groupChatId)
            }
        }

        if (activeGroupIds.length === 0) {
            return set ({ activeGroups: [] })
        }

        const q = query(
            collection(db, "groupchats"),
            where(documentId(), "in", activeGroupIds)
        )

        const groupChatsSnap = await getDocs(q);
        const groupChats = [];

        groupChatsSnap.forEach((group) => {
            const groupData = group.data()
            groupChats.push(groupData)
        })

        return set({ activeGroups: groupChats })
    }
}));

export default useUserStore;
