import { useEffect, useState } from "react";
import { collection, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../utils/firebase";
import { compareName } from "../utils/sort";
import { handleUserAdd } from "../utils/user";
import useChatStore from "../stores/chatStore";
import { useNavigationStore } from "../stores/navigationStore";
import useUserStore from '../stores/userStore';
import "./UserList.css";


const UserList = () => {
    const [users, setUsers] = useState([]);
    const [input, setInput] = useState("");

    const { 
        changeChat, 
        updateIsOnline, 
        updateLastSeen 
    } = useChatStore();
    const { setCurrentPage } = useNavigationStore();
    const { 
        currentUser, 
        fetchUserDetails, 
        updateUserDetails 
    } = useUserStore();

    const filteredUsers = users.filter((c) =>
        c.username.toLowerCase().includes(input.toLowerCase())
    );

    const handleSelectChat = async (uid) => {
        const currentUserChatsRef = doc(db, "userchats", currentUser.id);
        const currentUserChatSnap = await getDoc(currentUserChatsRef);
        const currentUserChats = currentUserChatSnap.data()?.chats;
    
        const chatIndex = currentUserChats.findIndex(
            (chat) => chat.receiverId === uid
        );
        currentUserChats[chatIndex].isSeen = true;
        const chat = currentUserChats[chatIndex];

        const otherUserDocRef = doc(db, "users", chat.receiverId);
        const otherUserDocSnap = await getDoc(otherUserDocRef);
        const otherUser = otherUserDocSnap.data()

        updateLastSeen(otherUser?.lastSeen);
        updateIsOnline(true);

        try {
            await updateDoc(currentUserChatsRef, {
                chats: currentUserChats,
            });
            changeChat(chat.chatId, otherUser);
            setCurrentPage("chats");
        } catch (err) {
            console.log(err)
        }
    }

    const addFriend = (uid) => {
        if (currentUser.friends.includes(uid)) {
            return
        }

        handleUserAdd(uid, currentUser.id);
        fetchUserDetails(currentUser.id);
    }

    useEffect(() => {
        const unSub = onSnapshot(
            collection(db, "users"),
            async (res) => {
                const allUsers = [];

                res.forEach((doc) => {
                    let data = doc.data();
                    if (data.id === currentUser.id) {
                        data["username"] = "You";
                    }
                    allUsers.push(data);
                });

                allUsers.sort(compareName);
                setUsers(allUsers);
            }
        );

        return () => {
            unSub();
        };
    }, [currentUser.id])

    useEffect(() => {
        const unSubscribe = onSnapshot(
            doc(db, "users", currentUser.id),
            async (res) => {
                const data = res.data();
                updateUserDetails(data);
            }
        );

        return () => {
            unSubscribe();
        }
    }, [currentUser.id, updateUserDetails])

    return (
        <div className='user-list'>
            <div className='search'>
                <div className='search-bar'>
                    <img src="/assets/images/search.png" alt=""/>
                    <input
                      type='text'
                      placeholder='Search users'
                      onChange={(e) => setInput(e.target.value)}
                    />
                </div>
            </div>
            {filteredUsers.map((user) => (
                <div 
                  className='user-item'
                  key={user.id}
                >
                    <img
                      src={user.blocked.includes(currentUser?.id)
                        ? "/assets/images/avatar.png"
                        : user.avatar || "/assets/images/avatar.png"
                      }
                      alt=""
                    />
                    <div className='user-details'>
                        <span>
                            {user.username}
                        </span>
                    </div>
                    <div className="actions">
                        {
                            (user.id !== currentUser.id) && (
                                currentUser.blocked.includes(user.id)
                                ? <i className="fa-solid fa-ban"></i>
                                : (
                                    currentUser.friends.includes(user.id)
                                    ? <i 
                                          className="fa-solid fa-envelope" 
                                          onClick={() => handleSelectChat(user.id)}
                                      ></i>
                                    : <i 
                                          className="fa-solid fa-user-plus" 
                                          onClick={() => addFriend(user.id)}
                                      ></i>
                                )
                            )
                        }
                    </div>
                </div>
            ))}
        </div>
    );
};

export default UserList;
