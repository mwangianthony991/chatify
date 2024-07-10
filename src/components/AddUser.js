import { useState } from "react";
import {
    collection,
    getDocs,
    query,
    where,
} from "firebase/firestore";
import { db } from "../utils/firebase";
import { handleUserAdd } from "../utils/user";
import useUserStore from "../stores/userStore";
import "./AddUser.css";


const AddUser = () => {
    const [user, setUser] = useState(null);
    const { currentUser } = useUserStore();

    const handleUserSearch = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const username = formData.get("username");

    try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            setUser(querySnapshot.docs[0].data());
        }
    } catch (error) {
        console.log(error);
    }};

    return (
        <div className="add-user">
            <form onSubmit={handleUserSearch}>
                <input type="text" placeholder="Username" name="username"/>
                <button>Search</button>
            </form>
            {user && (
                <div className="user">
                    <div className="detail">
                        <img src={user.avatar || "/assets/images/avatar.png"} alt=""/>
                        <span>{user.username}</span>
                    </div>
                    <button onClick={() => handleUserAdd(user.id, currentUser.id)}>Add User</button>
                </div>
            )}
        </div>
    );
}

export default AddUser;
