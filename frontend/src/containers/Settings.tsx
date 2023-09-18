import { Auth } from "aws-amplify";
import "./Settings.css";
import { useState, useEffect } from "react";

export default function Settings() {
    const [email, setEmail] = useState(null);

    useEffect(() => {
        async function getUser() {
            try {
                const user = await Auth.currentAuthenticatedUser();
                console.log(user);
                setEmail(user.attributes.email);
            } catch (error) {
                console.log(error);
            }
        }
        getUser();
    }, [])

    return (
        <div className="Settings">
            <div className="SettingsElement">
                <h2>Signed in as</h2>
                <h3>{email}</h3>
            </div>
            <div className="SettingsElement">
                <h2>Kindle E-mail</h2>
                <h3>test</h3>
            </div>
            <div className="SettingsElement">
                <h2>Feed Delivery</h2>
                <h3>Enabled</h3>
                <h3>Time</h3>
            </div>
            <div className="SettingsElement">
                <h2>Delete Account</h2>
                <h3>test</h3>
            </div>
        </div>
    );
}