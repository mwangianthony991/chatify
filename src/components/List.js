import ChatList from "./ChatList";
import GroupChatList from "./GroupChatList";
import { Profile } from "./Profile";
import { Title } from "./Title";
import UserList from "./UserList";
import { useGroupAddStore } from '../stores/userGroupAddStore';
import { useNavigationStore } from "../stores/navigationStore";
import "./List.css";


const List = () => {
    const { currentFormStep } = useGroupAddStore();
    const { currentPage } = useNavigationStore();

    return (
        <div className="list">
            {currentPage === "chats" && (
                <>
                    <Title title="Chats"/>
                    <ChatList/>
                </>
            )}
            {currentPage === "groups" && (
                <>
                    <Title title={
                        currentFormStep === 0 
                        ? "Groups" 
                        : currentFormStep === 1 
                        ? "Create new group" 
                        : "Add group details"
                    }/>
                    <GroupChatList/>
                </>
            )}
            {currentPage === "users" && (
                <>
                    <Title title="Users"/>  
                    <UserList/>
                </>
            )}
            {currentPage === "profile" && (
                <>
                    <Title title="Profile"/>
                    <Profile/>
                </>
            )}
        </div>
    );
}

export default List;
