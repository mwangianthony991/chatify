import { useEffect, useState } from "react";
import useUserStore from "../stores/userStore";
import { 
    collection, 
    doc, 
    getDocs,
    query, 
    updateDoc, 
    where } from "firebase/firestore";
import { db } from "../utils/firebase";
import upload from "../utils/upload";
import { toast } from "react-toastify";
import "./Profile.css";


const Profile = () => {
    const [isEditMode, setIsEditMode] = useState(false);
    const [newUsername, setNewUsername] = useState("");
    const { currentUser, updateUserDetails } = useUserStore();

    const handleUserAvatarUpdate = async (e) => {
        const fileUpload = e.target.files[0];

        if (!fileUpload) {
            return toast.warn("Please upload an avatar!")
        }

        const userDocRef = doc(db, "users", currentUser.id);

        try {
            const imgUrl = await upload(fileUpload);
            await updateDoc(userDocRef, {
                avatar: imgUrl
            });

            const updatedUser = { avatar: imgUrl, ...currentUser };
            updateUserDetails(updatedUser);

            toast.success("User avatar has been updated successfully")
        } catch (err) {
            toast.error(err.message)
        }
    }

    const handleUsernameUpdate = async () => {
        if (newUsername === "") {
            return toast.warn("Please enter a username")
        }

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", newUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return toast.warn("Username already exists. Please choose a new one");
        }

        const userDocRef = doc(db, "users", currentUser.id);

        try {
            await updateDoc(userDocRef, {
                username: newUsername
            });

            const updatedUser = { username: newUsername, ...currentUser };
            updateUserDetails(updatedUser);
            setIsEditMode(false);

            toast.success("Username updated successfully");
        } catch (err) {
            toast.error(err.message)
        }
    }

    useEffect(() => 
        {}, [currentUser]
    );

    return (
        <div className="profile">
            <div className="user">
                <label>
                    <img src={currentUser.avatar || "/assets/images/avatar.png"} alt=""/>
                    <input 
                      type="file" 
                      style={{ display: "none" }}
                      onChange={handleUserAvatarUpdate}
                    />
                </label>
            </div>
            <div className="info">
                <input 
                  type="text" 
                  name="username"
                  placeholder={currentUser.username}
                  value={isEditMode === false ? currentUser.username: newUsername}
                  disabled={!isEditMode}
                  onChange={(e) => {setNewUsername(e.target.value)}}
                />
                {!isEditMode
                ? (
                    <i 
                      className="fa-solid fa-pen-to-square"
                      onClick={() => setIsEditMode(true)}
                    >
                    </i>
                )
                : (
                    <i 
                      className="fa-solid fa-floppy-disk"
                      onClick={handleUsernameUpdate}
                    >
                    </i>
                )}
            </div>
        </div>
    );
}

export { Profile };
