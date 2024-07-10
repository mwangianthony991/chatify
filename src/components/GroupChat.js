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
import { useNavigationStore } from "../stores/navigationStore";
import useUserStore from "../stores/userStore";
import { useGroupChatStore } from "../stores/groupChatStore";
import "./GroupChat.css";


const GroupChat = () => {
    const [emojiSelectorOpen, setEmojiSelectorOpen] = useState(false);
    const [text, setText] = useState("");
    const [file, setFile] = useState({
        file: null,
        url: "",
        name: "",
        type: ""
    });
    const [categorizedMessages, setCategorizedMessages] = useState({});

    const { 
        groupChatDetailsIsToggled, 
        toggleGroupChatDetails 
    } = useNavigationStore();
    const { currentUser, users } = useUserStore();
    const { 
        groupChat,
        groupChatId, 
        isActiveGroupMember, 
        setIsUserAddMode,
        members, 
        setGroupChat,
        setMembers 
    } = useGroupChatStore();

    const endRef = useRef(null);

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
        const unSub = onSnapshot(
            doc(db, "groupchats", groupChatId), 
            (res) => {
                const chatData = res.data();
                const messages = chatData.messages
                for (let i = 0; i < messages.length; i++) {
                    const senderId = messages[i].senderId
                    messages[i]["username"] = users[[senderId]]?.username
                }
                chatData["messages"] = messages;

                setCategorizedMessages(() => categorizeMessagesByDate(chatData.messages));
                setGroupChat(chatData);
                setMembers(chatData.users);
            }
        );

        return () => {
            unSub();
        };
    }, [currentUser.id, groupChatId, users, setGroupChat, setMembers]);

    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" })
    })

    const handleEmoji = (e) => {
        setText((prev) => prev + e.emoji);
        setEmojiSelectorOpen(false);
    };

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

    const fetchMemberNames = () => {
        const sortedNames = members.map((member) => {
            if (member.id === currentUser.id) {
                return "You"
            }
            return member.username
        }).sort()
        return sortedNames;
    };

    const handleSend = async () => {
        if ((text === "") && (file.file === null))
            return;

        let fileUrl = null;

        try {
            if (file.file) {
                fileUrl = await upload(file.file);
            }

            await updateDoc(doc(db, "groupchats", groupChatId), {
                messages: arrayUnion({
                    senderId: currentUser.id,
                    text,
                    createdAt: new Date(),
                    isDeleted: false,
                    ...(fileUrl && { 
                        file: fileUrl,
                        fileType: file.type,
                        fileName: file.name
                    }),
                }),
            });

            const userIDs = groupChat.users;

            userIDs.forEach(async (uid) => {
                const userGroupChatsRef = doc(db, "usergroups", uid);
                const userGroupChatsSnapshot = await getDoc(userGroupChatsRef);

                if (userGroupChatsSnapshot.exists()) {
                    const userGroupChatsData = userGroupChatsSnapshot.data();

                    const groupChatIndex = userGroupChatsData.groupChats.findIndex(
                        (c) => c.groupChatId === groupChatId
                    );

                    const lastMsg = text === ""
                        ? (getFileMimeType(file.type) === "image"
                        ? "Photo"
                        : (getFileMimeType(file.type) === "video"
                        ? "Video"
                        : "Media"))
                        : text

                    userGroupChatsData.groupChats[groupChatIndex].lastMessage = lastMsg;
                    userGroupChatsData.groupChats[groupChatIndex].isSeen =
                        uid === currentUser.id ? true : false;
                    userGroupChatsData.groupChats[groupChatIndex].updatedAt = Date.now();

                    if (uid !== currentUser.id) {
                        const unreadMessages = userGroupChatsData.groupChats[groupChatIndex]?.unreadMessageCount || 0;
                        userGroupChatsData.groupChats[groupChatIndex]["unreadMessageCount"] = unreadMessages + 1;
                    }

                    await updateDoc(userGroupChatsRef, {
                        groupChats: userGroupChatsData.groupChats,
                    });
                }
            })
        } catch (err) {
            console.log(err)
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

    const toggleSidebar = (mode) => {
        if (!groupChatDetailsIsToggled) {
            toggleGroupChatDetails();
        }
        setIsUserAddMode(mode);
    }

    return (
        <div className="group-chat">
            <div className="top">
                <div className="user" onClick={toggleGroupChatDetails}>
                    <img src={groupChat?.avatar || "/assets/images/avatar.png"} alt=""/>
                    <div className="texts">
                        <span>{groupChat?.name}</span>
                        <p>
                            {fetchMemberNames().join(", ")}
                        </p>
                    </div>
                </div>
                <div className="icons">
                    <img 
                      src="/assets/images/info.png" 
                      alt="" 
                      onClick={() => toggleSidebar(false)}
                    />
                    <i 
                      className="fa-solid fa-user-plus"
                      onClick={() => toggleSidebar(true)}
                    >
                    </i>
                </div>
            </div>
            <div className="center">
                {categorizedMessages && 
                    Object.keys(categorizedMessages).map((date) => (
                        <div key={date} className="message-group">
                            <h4 className="message-date">{date}</h4>
                            {categorizedMessages[date].map((message) => (
                                <div 
                                  className={message.senderId === currentUser.id ? "message own" : "message"}
                                  key={message?.createdAt}
                                >
                                    <div className={message.senderId === currentUser.id ? "texts" : "texts other"}>
                                        {
                                            message.senderId !== currentUser.id && (
                                                <h5 className="sender-details">
                                                    {message.username}
                                                </h5>
                                        )}
                                        {
                                            message.file && 
                                            getFileMimeType(message.fileType) === "image" &&
                                            <>
                                                <img 
                                                  src={message.file} 
                                                  alt=""
                                                />
                                                    <span>
                                                        {getLocalTimeFromFirestoreDateObj(message.createdAt)}
                                                    </span>
                                            </>
                                        }
                                        {
                                            message.file && 
                                            getFileMimeType(message.fileType) === "video" &&
                                            <>
                                                <video id="video" onClick={handleVideoPlayback}>
                                                    <source src={message.file} type={message.fileType} />
                                                </video>
                                                <span>
                                                    {getLocalTimeFromFirestoreDateObj(message.createdAt)}
                                                </span>
                                            </>
                                        }
                                        {message.text && (
                                            <>
                                                <p>
                                                    {message.text}
                                                </p>
                                                <span>
                                                    {getLocalTimeFromFirestoreDateObj(message.createdAt)}
                                                </span>
                                            </>
                                        )}
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
                      !isActiveGroupMember
                      ? "You are no longer a participant"
                      : "Type a message ..."
                  }
                  value={text}
                  onChange={(e) => {setText(e.target.value)}}
                  disabled={!isActiveGroupMember}
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
                  disabled={!isActiveGroupMember}
                >
                    Send
                </button>
            </div>
        </div>
    );
}

export default GroupChat;
