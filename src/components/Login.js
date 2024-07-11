import { useState } from "react";
import { toast } from "react-toastify";
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
} from "firebase/auth";
import { auth, db } from "../utils/firebase";
import { collection, doc, query, where, getDocs, setDoc, updateDoc } from "firebase/firestore";
import upload from "../utils/upload";
import useUserStore from "../stores/userStore";
import "./Login.css";


const Login = () => {
    const [userAvatar, setUserAvatar] = useState({
        file: null,
        url: ""
    });
    const [loading, setLoading] = useState(false);
    const { fetchUserDetails } = useUserStore();

    function validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    }

    const handleUserAvatar = (e) => {
        let fileUpload = e.target.files[0]
        setUserAvatar({
            file: fileUpload,
            url: URL.createObjectURL(fileUpload)
        })
    };

    const handleUserRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target)
        const { username, email, password } = Object.fromEntries(formData)

        // validate inputs
        if (!username || !email || !password)
            return toast.warn("Please enter inputs!");

        if (!validateEmail(email))
            return toast.warn("Please enter a valid email address");

        if (!userAvatar.file)
            return toast.warn("Please upload an avatar!");

        // validate username is unique
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            return toast.warn("Username already exists. Please choose a new one");
        }

        try {
            const res = await createUserWithEmailAndPassword(auth, email, password);
            const imgUrl = await upload(userAvatar.file);
            const userID = res.user.uid
      
            await setDoc(doc(db, "users", userID), {
                username,
                email,
                avatar: imgUrl,
                id: res.user.uid,
                blocked: [],
                friends: [],
                lastSeen: new Date(),
                isOnline: true
            });
      
            await setDoc(doc(db, "userchats", userID), {
                chats: [],
            });

            await setDoc(doc(db, "usergroups", userID), {
                groupChats: [],
            });

            // update userStore with the newly created user
            fetchUserDetails(userID);

            toast.success("Account created successfully! Welcome");
          } catch (err) {
              console.error(err);
              toast.error(err.message);
          } finally {
              setLoading(false);
          }
    };

    const handleUserLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.target);
        const { email, password } = Object.fromEntries(formData);

        if (!validateEmail(email))
            return toast.warn("Please enter a valid email address");
    
        try {
            const res = await signInWithEmailAndPassword(auth, email, password);
            const uid = res?.user?.uid
            const userDocRef = doc(db, "users", uid);

            try {
                await updateDoc(userDocRef, {
                    isOnline: true,
                });
            } catch (err) {
                console.log(err);
            }

            toast.success("Login was successful")
        } catch (err) {
            console.error(err);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="chatify-login">
            <div className="chatify-login-item">
                <h2>Welcome back,</h2>
                <form className="chatify-login-form" onSubmit={handleUserLogin}>
                    <input className="chatify-login-input" type="text" placeholder="Email" name="email"/>
                    <input className="chatify-login-input" type="password" placeholder="Password" name="password"/>
                    <button disabled={loading}>{loading ? "Loading" : "Sign In"}</button>
                </form>         
            </div>
            <div className="separator"></div>
            <div className="chatify-login-item">
                <h2>Create an Account</h2>
                <form className="chatify-login-form" onSubmit={handleUserRegister}>
                    <label className="avatar-upload" htmlFor="file">
                        <img src={userAvatar.url || "/assets/images/avatar.png"} alt=""/>
                        Upload an image
                    </label>
                    <input
                      className="chatify-login-input"
                      type="file" 
                      id="file" 
                      style={{ display: "none" }} 
                      onChange={handleUserAvatar}
                    />
                    <input className="chatify-login-input" type="text" placeholder="Username" name="username"/>
                    <input className="chatify-login-input" type="text" placeholder="Email" name="email"/>
                    <input className="chatify-login-input" type="password" placeholder="Password" name="password"/>
                    <button disabled={loading}>{loading ? "Loading" : "Sign Up"}</button>
                </form>         
            </div>
        </div>
    );
}

export default Login;
