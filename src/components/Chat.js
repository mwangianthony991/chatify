import { useEffect, useRef, useState } from "react";
import EmojiPicker from "emoji-picker-react";
import {
    arrayUnion,
    doc,
    getDoc,
    onSnapshot,
    updateDoc,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { 
    getLocalDateFromFirestoreDateObj,
    getLocalTimeFromFirestoreDateObj 
} from "../utils/dates";
import { getFileMimeType } from "../utils/files";
import upload from "../utils/upload";
import useChatStore from "../stores/chatStore";
import { useNavigationStore } from "../stores/navigationStore";
import useUserStore from "../stores/userStore";
import "./Chat.css";


const Chat = () => {
    const [chat, setChat] = useState();
    const [emojiSelectorOpen, setEmojiSelectorOpen] = useState(false);
    const [text, setText] = useState("");
    const [file, setFile] = useState({
        file: null,
        url: "",
        name: "",
        type: ""
    });
    const [categorizedMessages, setCategorizedMessages] = useState({});

    const { toggleChatUserDetails } = useNavigationStore();
    const { currentUser } = useUserStore();
    const { 
        chatId, 
        user, 
        isCurrentUserBlocked, 
        isReceiverBlocked, 
        isOnline,
        lastSeen 
    } = useChatStore();

    const endRef = useRef(null);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [chat?.messages]);

    const categorizeMessagesByDate = (messages) => {
        return messages.reduce((acc, message) => {
            const date = getLocalDateFromFirestoreDateObj(message.createdAt);
            if (!acc[date]) {
                acc[date] = [];
            }
            acc[date].push(message);
            return acc;
        }, {});
    };

    useEffect(() => {
        const unSub = onSnapshot(doc(db, "chats", chatId), async (res) => {
            const data = res.data();

            setCategorizedMessages(() => categorizeMessagesByDate(data.messages));
            setChat(data);
        });

        return () => {
            unSub();
        };
    }, [chatId]);

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setEmojiSelectorOpen(false);
    }

    const handleFile = (e) => {
        const uploadedFile = e.target.files[0];

        if (uploadedFile) {
            setFile({
                file: uploadedFile,
                url: URL.createObjectURL(uploadedFile),
                name: uploadedFile.name,
                type: uploadedFile.type
            });
        }
    };

    const handleSend = async () => {
        if ((text === "") && (file.file === null))
            return;

        let fileUrl = null;

        try {
            if (file.file) {
                fileUrl = await upload(file.file);
            }
            const message = {
                senderId: currentUser.id,
                text,
                createdAt: new Date(),
                ...(fileUrl && { 
                    file: fileUrl,
                    fileType: file.type,
                    fileName: file.name
                }),
            }

            await updateDoc(doc(db, "chats", chatId), {
                messages: arrayUnion(message),
            });

            const userIDs = [currentUser.id, user.id];

            userIDs.forEach(async (id) => {
                const userChatsRef = doc(db, "userchats", id);
                const userChatsSnapshot = await getDoc(userChatsRef);

                if (userChatsSnapshot.exists()) {
                    const userChatsData = userChatsSnapshot.data();

                    const chatIndex = userChatsData.chats.findIndex(
                        (c) => c.chatId === chatId
                    );

                    const lastMsg = text === ""
                        ? (getFileMimeType(file.type) === "image"
                        ? "Photo"
                        : (getFileMimeType(file.type) === "video"
                        ? "Video"
                        : "Media"))
                        : text;

                    userChatsData.chats[chatIndex].lastMessage = lastMsg;
                    userChatsData.chats[chatIndex].isSeen =
                        id === currentUser.id ? true : false;
                    userChatsData.chats[chatIndex].updatedAt = Date.now();

                    if (id === user.id) {
                        const unreadMessages = userChatsData.chats[chatIndex]?.unreadMessageCount || 0;
                        userChatsData.chats[chatIndex]["unreadMessageCount"] = unreadMessages + 1;
                    }

                    await updateDoc(userChatsRef, {
                        chats: userChatsData.chats,
                    });
                }
            });
        } catch (err) {
            console.log(err);
        } finally {
            setFile({
                file: null,
                url: "",
                name: "",
                type: ""
            });
            setText("");
        }
    };

    const handleVideoPlayback = (e) => {
        if (e.target.paused === true) {
            e.target.play();
        } else {
            e.target.pause();
        }
    };

    return (
        <div className="chat">
            <div className="top">
                <div className="user" onClick={toggleChatUserDetails}>
                    <img src={user?.avatar || "/assets/images/avatar.png"} alt=""/>
                    <div className="texts">
                        <span>{user?.username}</span>
                        <p>{isOnline
                            ? "Online"
                            : `Last seen at ${getLocalTimeFromFirestoreDateObj(lastSeen)}`
                            }
                        </p>
                    </div>
                </div>
                <div className="icons">
                    <img 
                      src="/assets/images/info.png" 
                      alt=""
                      onClick={toggleChatUserDetails}
                    />
                </div>
            </div>
            <div className="center">
                {categorizedMessages && 
                    Object.keys(categorizedMessages).map((date) => (
                        <div key={date} className="message-group">
                            <h4>{date}</h4>
                            {categorizedMessages[date].map((message) => (
                                <div 
                                  className={message.senderId === currentUser.id ? "message own" : "message"}
                                  key={message?.createdAt}
                                >
                                    <div className="texts">
                                        {
                                            message.file && 
                                            getFileMimeType(message.fileType) === "image" &&
                                            <img id="image" src={message.file} alt="" />
                                        }
                                        {
                                            message.file && 
                                            getFileMimeType(message.fileType) === "video" &&
                                            (
                                                <video id="video" onClick={handleVideoPlayback}>
                                                    <source src={message.file} type={message.fileType} />
                                                </video>
                                            )
                                        }       
                                        {message.text && (
                                            <p>
                                                {message.text}
                                            </p>
                                        )}
                                        <span>
                                            {getLocalTimeFromFirestoreDateObj(message.createdAt)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            {file.url && (
                                <div className="message own">
                                    <div className="texts">
                                        {
                                            getFileMimeType(file.type) === "image"
                                            ? <img src={file.url} alt="" />
                                            : (
                                                <video id="video" onClick={handleVideoPlayback}>
                                                    <source src={file.file} type={file.type} />
                                                </video>
                                            )
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                <div ref={endRef}></div>
            </div>
            <div className="bottom">
                <div className="icons">
                    <label htmlFor="file">
                        <img src="/assets/images/img.png" alt=""/>
                    </label>
                    <input
                      type="file"
                      id="file"
                      style={{ display: "none" }}
                      onChange={handleFile}
                    />
                </div>
                <input
                  type="text"
                  placeholder={
                    isCurrentUserBlocked || isReceiverBlocked
                      ? "You cannot send a message"
                      : "Type a message ..."
                  }
                  value={text}
                  onChange={(e) => {setText(e.target.value)}}
                  disabled={isCurrentUserBlocked || isReceiverBlocked}
                />
                <div className="emoji">
                    <img 
                      src="/assets/images/emoji.png"
                      alt=""
                      onClick={() => setEmojiSelectorOpen((isOpen) => !isOpen)}
                    />
                    <div className="emoji-picker">
                        <EmojiPicker open={emojiSelectorOpen} onEmojiClick={handleEmoji}/>
                    </div>
                </div>
                <button
                  className="send-button"
                  onClick={handleSend}
                  disabled={isCurrentUserBlocked || isReceiverBlocked}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default Chat;
