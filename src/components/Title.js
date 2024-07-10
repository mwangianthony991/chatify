import "./Title.css";


const Title = ({ title }) => {
    return (
        <div className="title">
            <h2>{title || "Whatsapp"}</h2>
        </div>
    );
}

export { Title };
