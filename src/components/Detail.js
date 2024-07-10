import { useEffect, useState } from "react";
import { 
    arrayRemove, 
    arrayUnion, 
    collection, 
    doc, 
    documentId, 
    getDoc, 
    getDocs, 
    query, 
    updateDoc, 
    where 
} from "firebase/firestore";
import { auth, db } from "../utils/firebase";
import useChatStore from "../stores/chatStore";
import { useNavigationStore } from "../stores/navigationStore";
import useUserStore from "../stores/userStore";
import "./Detail.css";


const Detail = () => {
    const [sharedGroups, setSharedGroups] = useState([]);
    const [groupsSelectorIsActive, setGroupsSelectorIsActive] = useState(false);

    const { 
        user, 
        isCurrentUserBlocked, 
        isReceiverBlocked, 
        changeBlock, 
        resetChat 
    } = useChatStore();
    const { toggleChatUserDetails } = useNavigationStore();
    const { activeGroups, currentUser } = useUserStore();

    const handleBlock = async () => {
        if (!user)
            return

        const userDocRef = doc(db, "users", currentUser.id);

        try {
            await updateDoc(userDocRef, {
                blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
                friends: arrayRemove(user.id),
            });
            changeBlock();
        } catch (err) {
            console.log(err);
        }
    };

    const handleLogout = async () => {
        const userId = currentUser.id
        const userDocRef = doc(db, "users", userId);

        try {
            await updateDoc(userDocRef, {
                lastSeen: new Date(),
                isOnline: false,
            });
        } catch (err) {
            console.log(err);
            
        }

        auth.signOut();
        resetChat()
    };

    useEffect(() => {
        const fetchSharedGroups = async () => {
            const userGroupsRef = doc(db, "usergroups", user?.id);
            const userGroupsSnap = await getDoc(userGroupsRef);
            const allGroups = userGroupsSnap.data().groupChats;
    
            const activeGroupIds = [];
    
            for (let i = 0; i < allGroups.length; i++) {
                if (allGroups[i]?.isActive === true) {
                    activeGroupIds.push(allGroups[i].groupChatId)
                }
            }
    
            if (activeGroupIds.length === 0) {
                return
            }
    
            const currentUserGroupIDs = activeGroups.map(grp => grp?.id)
            const commonGroupIds = activeGroupIds.filter(
                element => currentUserGroupIDs.includes(element));
    
            const q = query(
                collection(db, "groupchats"),
                where(documentId(), "in", commonGroupIds)
            )
    
            const groupChatsSnap = await getDocs(q);
            const commonGroups = [];
    
            groupChatsSnap.forEach((group) => {
                commonGroups.push(group.data())
            })
    
            setSharedGroups(commonGroups);
        }

        fetchSharedGroups();
    }, [user.id, activeGroups])

    return (
        <div className="detail">
            <i className="fa-solid fa-xmark" onClick={toggleChatUserDetails}></i>
            <div className="user">
                <img src={user?.avatar || "/assets/images/avatar.png"} alt=""/>
                <h2>{user?.username}</h2>
            </div>
            <div className="info">
                <div className="option">
                    <div className="title">
                        <span>Shared Groups</span>
                        <img 
                          src={groupsSelectorIsActive === true 
                                ? "/assets/images/arrowDown.png" 
                                : "/assets/images/arrowUp.png"
                              } 
                          alt=""
                          onClick={() => setGroupsSelectorIsActive((prev) => !prev)}
                        />
                    </div>
                    {groupsSelectorIsActive && 
                        <div className="groups">
                            {sharedGroups.map((group) => 
                                <div className="group" key={group.id}>
                                    <div className="group-detail">
                                        <img src={group.avatar} alt=""/>
                                        <span>{group.name}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    }
                </div>
                <button onClick={handleBlock}>
                    {isCurrentUserBlocked 
                        ? "You are Blocked!" 
                        : isReceiverBlocked
                        ? "Unblock User" 
                        : "Block User"
                    }
                </button>
                <button className="logout" onClick={handleLogout}>
                    Logout
                </button>
            </div>
        </div>
    );
}

export default Detail;
