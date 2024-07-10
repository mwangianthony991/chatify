import { useEffect } from "react";
import Chat from "./Chat";
import GroupChat from "./GroupChat";
import GroupChatDetail from "./GroupChatDetail";
import Detail from "./Detail";
import List from "./List";
import Login from "./Login";
import Notification from "./Notification";
import { Sidebar } from "./Sidebar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../utils/firebase";
import useChatStore from "../stores/chatStore";
import { useGroupChatStore } from "../stores/groupChatStore";
import { useNavigationStore } from "../stores/navigationStore";
import useUserStore from "../stores/userStore";
import './index.css';


const App = () => {
    const { 
      currentUser, 
      fetchActiveGroups,
      fetchAllUsers, 
      fetchUserDetails, 
      isLoading 
    } = useUserStore();
    const { chatId } = useChatStore();
    const { groupChat, groupChatId } = useGroupChatStore();
    const { 
      chatUserDetailsIsToggled, 
      currentPage, 
      groupChatDetailsIsToggled 
    } = useNavigationStore();

    useEffect(() => {
      const unSub = onAuthStateChanged(auth, (user) => {
        fetchUserDetails(user?.uid);
        fetchAllUsers();
        fetchActiveGroups(user?.uid);
      });

      return () => {
        unSub();
      };
    }, [fetchUserDetails, fetchAllUsers, fetchActiveGroups]);

    if (isLoading)
      return <div className="loading">Loading...</div>

    return (
        <div className='container'>
          {currentUser ? (
            <>
              <Sidebar/>
              <List/>
              {chatId && currentPage === "chats" && <Chat />}
              {groupChatId && currentPage === "groups" && <GroupChat />}
              {chatId && currentPage === "chats" && chatUserDetailsIsToggled && <Detail />}
              {groupChat && currentPage === "groups" && groupChatDetailsIsToggled && <GroupChatDetail />}
            </>
          ) : (
            <Login/>
          )}
          <Notification/>
        </div>
    );
}

export default App;
