import { useState } from "react";
import { 
    arrayUnion,
    collection, 
    doc, 
    serverTimestamp, 
    setDoc, 
    writeBatch 
} from "firebase/firestore";
import { db } from "../utils/firebase";
import upload from "../utils/upload";
import { useGroupAddStore } from '../stores/userGroupAddStore';
import useUserStore from "../stores/userStore";
import { toast } from "react-toastify";
import "./CreateGroup.css";


const CreateGroup = () => {
    const [groupAvatar, setGroupAvatar] = useState({
        file: null,
        url: ""
    });

    const { groupUsers, setCurrentFormStep } = useGroupAddStore();
    const { currentUser } = useUserStore();

    const handleGroupAvatar = (e) => {
        let fileUpload = e.target.files[0];
        setGroupAvatar({
            file: fileUpload,
            url: URL.createObjectURL(fileUpload)
        })
    };

    const createGroup = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        const { groupName } = Object.fromEntries(formData);

        if (!groupName) {
            return toast.warn("Please enter a group name!");
        }

        if (!groupAvatar.file) {
            return toast.warn("Please upload a group icon!");
        }

        const imgUrl = await upload(groupAvatar.file);

        const groupChatRef = collection(db, "groupchats");
        const userGroupsRef = collection(db, "usergroups");
        const batch = writeBatch(db);

        const allGroupUsers = [currentUser.id, ...groupUsers];

        try {
            const newGroupChatRef = doc(groupChatRef);
            const newGroupChatRefId = newGroupChatRef.id;

            await setDoc(newGroupChatRef, {
                id: newGroupChatRefId,
                createdAt: serverTimestamp(),
                name: groupName,
                avatar: imgUrl,
                users: allGroupUsers,
                admins: [currentUser.id],
                messages: [],
            });

            allGroupUsers.forEach((uid) => {
                const now = Date.now()
                const data = {
                    groupChats: arrayUnion({
                        groupChatId: newGroupChatRefId,
                        lastMessage: "",
                        unreadMessageCount: 0,
                        senderId: uid,
                        isActive: true,
                        joinedAt: now,
                        updatedAt: Date.now(),
                    })
                }
                const userGroupRef = doc(userGroupsRef, uid);

                batch.update(userGroupRef, data)
            });
            await batch.commit();

            setCurrentFormStep(0);
            toast.success(`Group ${groupName} has been created successfully`)
        } catch (err) {
            console.log(err);
            toast.error(err.message);
        }
    }

    return (
        <div className="group-detail">
            <form onSubmit={createGroup}>
                <label className="group-label" htmlFor="file">
                    <img src={groupAvatar.url || "/assets/images/avatar.png"} alt=""/>
                    <div className="group-avatar-text">
                        Upload an image
                    </div>
                </label>
                <input
                  type="file" 
                  id="file" 
                  style={{ display: "none" }} 
                  onChange={handleGroupAvatar}
                />
                <input type="text" placeholder="Group name" name="groupName"/>
                <button className="submit-group-dtls">
                    <img 
                      src="/assets/images/flatTick.svg" 
                      alt=""
                      className="submit-group-dtls-btn"
                    />
                </button>
            </form>
        </div>
    );
}

export default CreateGroup;
