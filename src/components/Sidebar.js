import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../utils/firebase";
import useChatStore from "../stores/chatStore";
import { useNavigationStore } from "../stores/navigationStore";
import useUserStore from "../stores/userStore";
import "./Sidebar.css";


const Sidebar = () => {
    const { resetChat } = useChatStore()
    const { 
        currentPage, 
        setCurrentPage 
    } = useNavigationStore();
    const { currentUser } = useUserStore();

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

    return (
        <nav className="sidebar">
            <ul>
                <li 
                  onClick={() => setCurrentPage("chats")} 
                  className={currentPage === "chats" ? "active" : ""}
                >
                    <i className="fa-solid fa-message"></i>
                    <span className="tooltiptext">Chats</span>
                </li>
                <li 
                  onClick={() => setCurrentPage("groups")}
                  className={currentPage === "groups" ? "active" : ""}
                >
                    <i className="fa-solid fa-user-group"></i>
                    <span className="tooltiptext">Groups</span>
                </li>
                <li 
                  onClick={() => setCurrentPage("users")}
                  className={currentPage === "users" ? "active" : ""}
                >
                    <i className="fa-solid fa-user-plus"></i>
                    <span className="tooltiptext">Users</span>
                </li>
                <li 
                  onClick={() => setCurrentPage("profile")}
                  className={currentPage === "profile" ? "profile" : ""}
                >
                    <img src={currentUser.avatar || "/assets/images/avatar.png"} alt=""/>
                    <span className="tooltiptext">Profile</span>
                </li>
                <li onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    <span className="tooltiptext">Logout</span>
                </li>
            </ul>
        </nav>
    );
}

export { Sidebar };
