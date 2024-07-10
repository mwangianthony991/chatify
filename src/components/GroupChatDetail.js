import { useEffect, useRef, useState } from "react";
import { 
    arrayRemove,
    arrayUnion,
    collection, 
    doc, 
    getDoc, 
    onSnapshot,
    updateDoc
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { useGroupChatStore } from "../stores/groupChatStore";
import { useNavigationStore } from "../stores/navigationStore";
import useUserStore from "../stores/userStore";
import { compareName } from "../utils/sort";
import upload from "../utils/upload";
import { handleUserAdd } from "../utils/user";
import { toast } from "react-toastify";
import "./GroupChatDetail.css";


const GroupChatDetail = () => {
    const inputRef = useRef();
    const headingRef = useRef();

    const [users, setUsers] = useState([]);
    const [groupMembersSelectorIsActive, setGroupMembersSelectorIsActive] = useState(false);
    const [input, setInput] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [newGroupName, setNewGroupName] = useState("");

    const { currentUser } = useUserStore();
    const {
        groupChatId, 
        groupChat,
        isActiveGroupMember,
        isUserAddMode, 
        members,
        setGroupChat,
        setIsActiveGroupMember
    } = useGroupChatStore();
    const { setCurrentPage, toggleGroupChatDetails } = useNavigationStore();

    const handleMessageMember = (memberId) => {
        handleUserAdd(memberId, currentUser.id);
        setCurrentPage("chats");
    }

    const removeGroupMember = async (uid) => {
        const userGroupChatRef = doc(db, "usergroups", uid);
        const userGroupChatSnapshot = await getDoc(userGroupChatRef);

        if (userGroupChatSnapshot.exists()) {
            const userGroupChatData = userGroupChatSnapshot.data();

            const groupChatIndex = userGroupChatData.groupChats.findIndex(
                (c) => c.groupChatId === groupChatId
            );

            userGroupChatData.groupChats[groupChatIndex].isActive = false;
            userGroupChatData.groupChats[groupChatIndex].updatedAt = Date.now();

            await updateDoc(userGroupChatRef, {
                groupChats: userGroupChatData.groupChats,
            });
            
        }

        const groupChatsRef = doc(db, "groupchats", groupChatId);

        try {
            await updateDoc(groupChatsRef, {
                admins: arrayRemove(uid),
                users: arrayRemove(uid)
            })
        } catch (err) {
            console.log(err)
        }
        if (uid === currentUser.id) {
            setIsActiveGroupMember(false);
        }
    };

    const addGroupAdmin = async (uid) => {
        const groupChatsRef = doc(db, "groupchats", groupChatId);
        const admins = groupChat.admins;
        admins.push(uid);

        try {
            await updateDoc(groupChatsRef, {
                admins: arrayUnion(uid),
            });
            const updatedGroupChatData = {
                ...groupChat,
                admins: admins
            }
            setGroupChat(updatedGroupChatData);
        } catch (err) {
            console.log(err)
        }
    };

    const addGroupMember = async (uid) => {
        const userGroupsRef = doc(db, "usergroups", uid);
        const groupChatsRef = doc(db, "groupchats", groupChatId);

        const now = Date.now()
        const data = {
            groupChats: arrayUnion({
                groupChatId: groupChatId,
                lastMessage: "",
                unreadMessageCount: 0,
                senderId: uid,
                isActive: true,
                joinedAt: now,
                updatedAt: now,
            })
        }

        try {
            await updateDoc(userGroupsRef, data);
            await updateDoc(groupChatsRef, {
                users: arrayUnion(uid)
            });
            toast.success("User added successfully")
        } catch (err) {
            toast.error(err.message)
        }
    };

    const filteredUsers = users.filter((c) =>
        c.username.toLowerCase().includes(input.toLowerCase())
    );

    useEffect(() => {
        const unSub = onSnapshot(
            collection(db, "users"),
            async (res) => {
                const allUsers = [];
                const memberIDs = members.map(mem => mem.id);

                res.forEach((doc) => {
                    let data = doc.data();
                    if (!memberIDs.includes(data.id)) {
                        allUsers.push(data);
                    }
                });

                allUsers.sort(compareName);
                setUsers(allUsers);
            }
        );

        return () => {
            unSub();
        };
    }, [currentUser.id, members, groupChat.name])

    const handleGroupAvatarUpdate = async (e) => {
        const fileUpload = e.target.files[0];

        if (!fileUpload) {
            return toast.warn("Please upload an avatar!")
        }

        const groupChatRef = doc(db, "groupchats", groupChatId);

        try {
            const imgUrl = await upload(fileUpload);
            await updateDoc(groupChatRef, {
                avatar: imgUrl
            });

            const updatedGroupDetails = { 
                avatar: imgUrl, 
                ...groupChat 
            };
            setGroupChat(updatedGroupDetails);

            toast.success("Group avatar has been updated successfully")
        } catch (err) {
            toast.error(err.message)
        }
    };

    const handleGroupNameUpdate = async () => {
        if (newGroupName === "") {
            return toast.warn("Please enter a name")
        }

        inputRef.current.style.display = "none";
        headingRef.current.style.display = "block";

        const userDocRef = doc(db, "groupchats", groupChatId);

        try {
            await updateDoc(userDocRef, {
                name: newGroupName
            });
            const updatedGroupDetails = {
                ...groupChat 
            };
            updatedGroupDetails.name = newGroupName;

            setGroupChat(updatedGroupDetails);
            setIsEditMode(false);

            toast.success("Group name updated successfully");
        } catch (err) {
            toast.error(err.message)
        }
    };

    const activateInputBox = () => {
        setIsEditMode(true);

        headingRef.current.style.display = "none";
        inputRef.current.style.display = "block";
        inputRef.current.style.padding = "10px";
        inputRef.current.style.width = "90%";
        inputRef.current.style.border = "none";
        inputRef.current.style.outline = "none";
        inputRef.current.style.backgroundColor = "rgba(17, 25, 40, 0.6)";
        inputRef.current.style.color = "white";
        inputRef.current.style.borderRadius = "5px";
    };

    return (
        <>
        {groupChat && 
            <div className="group-chat-detail">
                <i className="fa-solid fa-xmark" onClick={toggleGroupChatDetails}></i>
                <div className="group">
                    <label>
                        <img src={groupChat.avatar || "/assets/images/avatar.png"} alt=""/>
                        <input 
                          type="file" 
                          style={{ display: "none" }}
                          onChange={handleGroupAvatarUpdate}
                        />
                    </label>
                    <h2 ref={headingRef}>
                        {groupChat.name}
                    </h2>
                    <input
                      type="text"
                      style={{ display: "none" }}
                      disabled={!isEditMode}
                      onChange={(e) => {setNewGroupName(e.target.value)}}
                      ref={inputRef}
                    />
                    {!isEditMode
                    ? (
                        <i 
                          className="fa-solid fa-pen-to-square"
                          onClick={activateInputBox}
                        ></i>
                    )
                    : (
                        <i 
                          className="fa-solid fa-floppy-disk"
                          onClick={handleGroupNameUpdate}
                        ></i>
                    )}
                    </div>
                <div className="group-info">
                    {isUserAddMode === true 
                    ? (
                    <>
                        <div className='search'>
                            <div className='search-bar'>
                                <img src="/assets/images/search.png" alt=""/>
                                <input
                                  type='text'
                                  placeholder='Add new members'
                                  onChange={(e) => setInput(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="users">
                            {filteredUsers.map((user) => (
                                <div className="user" key={user.id}>
                                    <div className="user-detail">
                                        <img src={user.avatar} alt=""/>
                                        <span>{user.username}</span>
                                    </div>
                                    <div className="user-actions">
                                        <i 
                                          className="fa-solid fa-user-plus" 
                                          onClick={() => addGroupMember(user.id)}
                                        ></i>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                    )
                    : (
                        <div className="option">
                            <div className="title">
                                <span>{`${members.length} Members`}</span>
                                <img 
                                src={groupMembersSelectorIsActive === true 
                                        ? "/assets/images/arrowDown.png" 
                                        : "/assets/images/arrowUp.png"
                                    } 
                                alt=""
                                onClick={() => setGroupMembersSelectorIsActive((prev) => !prev)}
                                />
                            </div>
                            {groupMembersSelectorIsActive && 
                                <div className="group-members">
                                    {members.map((member) => 
                                        <div className="group-member" key={member.id}>
                                            <div className="group-member-detail">
                                                <img src={member.avatar} alt=""/>
                                                <span>
                                                    {
                                                        member.username === currentUser.username 
                                                        ? "You"
                                                        : member.username
                                                    }
                                                </span>
                                                {groupChat.admins.includes(member.id) &&
                                                <button className="admin-flair">Admin</button>}
                                            </div>
                                            <div className="member-actions">
                                                {member.id !== currentUser.id 
                                                && !groupChat.admins.includes(member.id) 
                                                && groupChat.admins.includes(currentUser.id) &&
                                                    <i 
                                                      className="fa-solid fa-wrench"
                                                      onClick={() => addGroupAdmin(member.id)}
                                                    ></i>
                                                }
                                                {member.id !== currentUser.id && groupChat.admins.includes(currentUser.id) &&
                                                    <i 
                                                      className="fa-regular fa-circle-xmark"
                                                      onClick={() => removeGroupMember(member.id)}
                                                    ></i>
                                                }
                                                {member.id !== currentUser.id &&
                                                    <i 
                                                    className="fa-solid fa-envelope"
                                                    onClick={() => handleMessageMember(member.id)}
                                                    ></i>
                                                }
                                            </div>
                                        </div>
                                    )}
                                </div>
                            }
                        </div>
                        )
                    }
                    <button
                      onClick={() => removeGroupMember(currentUser.id)} 
                      disabled={!isActiveGroupMember}
                    >{isActiveGroupMember ? "Exit Group" : "No longer a member"}
                    </button>
                </div>
            </div>
        }
        </>
    );
}

export default GroupChatDetail;
