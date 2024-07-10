import {
    arrayUnion,
    collection,
    doc,
    getDoc,
    serverTimestamp,
    setDoc,
    updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";


export const handleUserAdd = async (uid, currentUserId) => {
    if (!uid) {
        return
    }

    const chatRef = collection(db, "chats");
    const userChatsRef = collection(db, "userchats");

    try {
        const currentUserDocRef = doc(db, "users", currentUserId);
        const currentUserDocSnap = await getDoc(currentUserDocRef);

        const currentUserData = currentUserDocSnap.data();
        const currentUserFriends = currentUserData?.friends || [];
    
        if (currentUserFriends.includes(uid)) {
            console.log("User is already a friend")
            return
        }

        await updateDoc(currentUserDocRef, {
            friends: arrayUnion(uid),
        });

        const otherUserDocRef = doc(db, "users", uid);
        const otherUserDocSnap = await getDoc(otherUserDocRef);

        const otherUserData = otherUserDocSnap.data();
        const otherUserFriends = otherUserData?.friends || [];
    
        if (otherUserFriends.includes(currentUserId)) {
            console.log("Current user is already a friend")
            return
        }

        await updateDoc(otherUserDocRef, {
            friends: arrayUnion(currentUserId),
        });

        const newChatRef = doc(chatRef);

        await setDoc(newChatRef, {
            createdAt: serverTimestamp(),
            messages: [],
        });

        await updateDoc(doc(userChatsRef, uid), {
            chats: arrayUnion({
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: currentUserId,
                updatedAt: Date.now(),
                unreadMessageCount: 0
            }),
        });

        await updateDoc(doc(userChatsRef, currentUserId), {
            chats: arrayUnion({
                chatId: newChatRef.id,
                lastMessage: "",
                receiverId: uid,
                updatedAt: Date.now(),
                unreadMessageCount: 0
            }),
        });
    } catch (error) {
        console.log(error);
    }
};
