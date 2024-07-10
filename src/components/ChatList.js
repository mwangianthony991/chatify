import { useEffect, useState } from 'react';
import { db } from '../utils/firebase';
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import useChatStore from '../stores/chatStore';
import useUserStore from '../stores/userStore';
import './ChatList.css';


const ChatList = () => {
    const [chats, setChats] = useState([]);
    const [input, setInput] = useState("");

    const { currentUser } = useUserStore();
    const { 
        changeChat,
        updateIsOnline, 
        updateLastSeen 
    } = useChatStore();

    useEffect(() => {
        const unSub = onSnapshot(
            doc(db, "userchats", currentUser.id),
            async (res) => {
                const items = res.data()?.chats || [];

                if (items.length === 0) {
                    setChats([]);
                }

                const promises = items.map(async (item) => {
                    const userDocRef = doc(db, "users", item.receiverId);
                    const userDocSnap = await getDoc(userDocRef);
                    const user = userDocSnap.data();
    
                    return { ...item, user };
                });
    
                const chatData = await Promise.all(promises);
    
                setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
            }
        );
    
        return () => {
            unSub();
        };
    }, [currentUser.id]);

    const handleSelect = async (chat) => {
        const userChats = chats.map((item) => {
            const { user, ...others } = item;
            return others;
        });

        try {
            updateLastSeen(chat.user?.lastSeen);
            updateIsOnline(true);

            const chatIndex = userChats.findIndex(
                (item) => item.chatId === chat.chatId
            );
            userChats[chatIndex].isSeen = true;
            userChats[chatIndex]["unreadMessageCount"] = 0;

            const userChatsRef = doc(db, "userchats", currentUser.id);
            await updateDoc(userChatsRef, {
                chats: userChats,
            });

            changeChat(chat.chatId, chat.user);
        } catch (err) {
            console.log(err)
        }
    };

    const filteredChats = chats.filter((c) =>
        c.user.username.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className='chat-list'>
            <div className='search'>
                <div className='search-bar'>
                    <img src="/assets/images/search.png" alt=""/>
                    <input
                      type='text'
                      placeholder='Search chats'
                      onChange={(e) => setInput(e.target.value)}
                    />
                </div>
            </div>
            {filteredChats.map((chat) => (
                <div 
                  className='chat-item'
                  key={chat?.chatId}
                  onClick={() => handleSelect(chat)}
                  style={{
                    backgroundColor: chat?.isSeen ? "transparent" : "#5183fe",
                  }}
                >
                    <img
                      src={chat.user.blocked.includes(currentUser?.id)
                        ? "/assets/images/avatar.png"
                        : chat.user.avatar || "/assets/images/avatar.png"
                      }
                      alt=""
                    />
                    <div className='texts'>
                        <span>
                            {chat.user.blocked.includes(currentUser.id)
                              ? "Blocked User"
                              : chat.user.username
                            }
                        </span>
                        <p>
                            {chat.lastMessage === "Photo" 
                                ? (
                                    <>
                                        <i className="fa-solid fa-image"></i>
                                        {chat.lastMessage}
                                    </>
                                  )
                                : chat.lastMessage === "Video"
                                ? (
                                    <>
                                        <i className="fa-solid fa-video"></i>
                                        {chat.lastMessage}
                                    </>
                                  )
                                : chat.lastMessage
                            }
                        </p>
                    </div>
                    {chat.unreadMessageCount > 0 &&
                        <div className="text-count">
                            {chat.unreadMessageCount}
                        </div>
                    }   
                </div>
            ))}
        </div>
    );
}

export default ChatList;
