import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../utils/firebase";
import { compareName } from "../utils/sort";
import { useGroupAddStore } from '../stores/userGroupAddStore';
import useUserStore from "../stores/userStore";
import "./AddGroupUsers.css";


const AddGroupUsers = () => {
    const [users, setUsers] = useState([]);
    const { 
        groupUsers, 
        currentFormStep, 
        setCurrentFormStep, 
        setGroupUsers 
    } = useGroupAddStore();
    const { currentUser } = useUserStore();

    useEffect(() => {
        const fetchUsers = async () => {
            const userRef = collection(db, "users");
            const q = query(userRef, where("id", "!=", currentUser.id));
            await getDocs(q)
                .then((querySnapshot)=>{              
                    const newData = querySnapshot.docs
                        .map((doc) => ({...doc.data()}));
                    newData.sort(compareName);
                    setUsers(newData);
                })
        }
        fetchUsers();
    }, [currentUser.id])

    const handleSelectUser = (user) => {
        const newGroupUserList = [...groupUsers];
        const index = newGroupUserList.indexOf(user.id);

        if (index > -1) {
            newGroupUserList.splice(index, 1)
        } else {
            newGroupUserList.push(user.id)
        }
        setGroupUsers(newGroupUserList);
    }

    return (
        <>
            {users.map((user) => (
                <div 
                  className={!groupUsers.includes(user.id) ? "user-item" : "user-item active"}
                  key={user?.id}
                  onClick={() => handleSelectUser(user)}
                >
                    <img 
                      src={user.avatar || "/assets/images/avatar.png"} 
                      alt="" 
                    />
                    {user.username}
                </div>
            ))}
            <div className="nav-page">
                <img 
                    src="/assets/images/arrowLeft.svg" 
                    alt=""
                    className="nav-next-btn"
                    onClick={() => setCurrentFormStep(currentFormStep-1)}
                />
                {(groupUsers.length > 0) && 
                    <img 
                      src="/assets/images/arrowRight.svg" 
                      alt=""
                      className="nav-next-btn"
                      onClick={() => setCurrentFormStep(2)}
                    />
                }
            </div>
        </>
    );
}

export default AddGroupUsers;
