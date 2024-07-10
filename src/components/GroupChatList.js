import { useEffect, useState } from 'react';
import AddGroupUsers from './AddGroupUsers';
import CreateGroup from "./CreateGroup";
import useChatStore from '../stores/chatStore';
import { useGroupAddStore } from '../stores/userGroupAddStore';
import { useGroupChatStore } from '../stores/groupChatStore';
import { useNavigationStore } from '../stores/navigationStore';
import useUserStore from '../stores/userStore';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import "./GroupChatList.css";


const GroupChatList = () => {
    const [groupChats, setGroupChats] = useState([]);
    const [input, setInput] = useState("");

    const { currentUser } = useUserStore();
	  const { updateIsOnline, updateLastSeen } = useChatStore();
    const { currentFormStep, setCurrentFormStep } = useGroupAddStore();
    const { 
      changeGroupChat, 
      setIsActiveGroupMember
    } = useGroupChatStore();
    const { 
      groupChatDetailsIsToggled, 
      toggleGroupChatDetails
    } = useNavigationStore();

    useEffect(() => {
      const unSub = onSnapshot(
        doc(db, "usergroups", currentUser.id),
        async (res) => {
          const groupChatItems = res.data().groupChats || [];

          if (groupChatItems.length === 0) {
            setGroupChats([]);
          }

          const promises = groupChatItems.map(async (item) => {
            const groupChatDocRef = doc(db, "groupchats", item.groupChatId);
            const groupChatDocSnap = await getDoc(groupChatDocRef);
            const otherInfo = groupChatDocSnap.data();

            return { ...item, otherInfo };
          });

          const groupChatData = await Promise.all(promises);

          setGroupChats(groupChatData.sort((a, b) => b.updatedAt - a.updatedAt));
        }
      );

      return () => {
        unSub();
      };
    }, [currentUser.id])

    const handleGroupChatSelect = async (groupChat) => {
        const userGroupChats = [...groupChats];
        const groupChatIndex = userGroupChats.findIndex(
        (item) => item.groupChatId === groupChat.groupChatId
        );
        userGroupChats[groupChatIndex].isSeen = true;

        const userGroupChatsRef = doc(db, "usergroups", currentUser.id);
        const userIsOnline = currentUser.isOnline;
        updateLastSeen(currentUser.lastSeen);

        if (!userIsOnline) {
            updateIsOnline(true);
        }
        setIsActiveGroupMember(groupChat.isActive);

        if (groupChatDetailsIsToggled) {
            toggleGroupChatDetails();
        }

        try {
            userGroupChats[groupChatIndex]["unreadMessageCount"] = 0;

            const newGroupChats = userGroupChats.map(({ otherInfo, ...item }) => item);
            await updateDoc(userGroupChatsRef, {
                groupChats: newGroupChats
            });
            changeGroupChat(groupChat.groupChatId);
        } catch (err) {
            console.log(err)
        }};

    const filteredGroupChats = groupChats.filter((gc) =>
        gc?.otherInfo.name.toLowerCase().includes(input.toLowerCase())
    );

    return (
        <div className='group-chat-list'>
          <div className='search'>
              <div className='search-bar'>
                  <img src="/assets/images/search.png" alt=""/>
                  <input
                    type='text'
                    placeholder='Search groups'
                    onChange={(e) => setInput(e.target.value)}
                  />
              </div>
              <img
                src={"/assets/images/plus.png"} 
                alt=""
                className="add"
                onClick={() => setCurrentFormStep(1)}
              />
          </div>
          {currentFormStep === 0 && filteredGroupChats.map((groupChat) => (
            <div 
              className='group-chat-item'
              key={groupChat?.groupChatId}
              onClick={() => handleGroupChatSelect(groupChat)}
              style={{
                backgroundColor: groupChat?.isSeen ? "transparent" : "#5183fe",
              }}
            >
              <img 
                src={groupChat?.otherInfo.avatar || "/assets/images/avatar.png"}
                alt=""
              />
              <div className='group-chat-texts'>
                  <span>
                      {groupChat?.otherInfo.name}
                  </span>
                  <p>
                  {groupChat.lastMessage === "Photo" 
                    ? (
                        <>
                            <i className="fa-solid fa-image"></i>
                            {groupChat.lastMessage}
                        </>
                      )
                    : groupChat.lastMessage === "Video"
                    ? (
                        <>
                            <i className="fa-solid fa-video"></i>
                            {groupChat.lastMessage}
                        </>
                      )
                    : groupChat.lastMessage
                  }
                  </p>
              </div>
              {groupChat.unreadMessageCount > 0 &&
                  <div className="text-count">
                      {groupChat.unreadMessageCount}
                  </div>
              }
            </div>
          ))}
          {currentFormStep === 1 &&
            <AddGroupUsers/>
          }
          {currentFormStep === 2 &&
            <CreateGroup/>
          }
        </div>
    );
}

export default GroupChatList;
