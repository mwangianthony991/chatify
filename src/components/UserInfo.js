import useUserStore from "../stores/userStore";
import "./UserInfo.css";


const UserInfo = () => {
    const { currentUser } = useUserStore();

    return (
        <div className="user-info">
            <div className="user">
                <img src={currentUser.avatar || "/assets/images/avatar.png"} alt=""/>
                <h2>{currentUser.username}</h2>
            </div>
            <div className="icons">
                <img src="/assets/images/more.png" alt=""/>
                <img src="/assets/images/video.png" alt=""/>
                <img src="/assets/images/edit.png" alt=""/>
            </div>
        </div>
    );
}

export default UserInfo;
