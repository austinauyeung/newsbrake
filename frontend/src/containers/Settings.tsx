import { Auth } from "aws-amplify";
import "./Settings.css";
import { useState, useEffect } from "react";
import { Form, InputGroup } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { useAppContext } from "../lib/contextLib";
import { handlePrefChange } from "../lib/hooksLib";
import updateData from "../lib/putPreferences"
import { useNavigate } from "react-router-dom";

export default function Settings() {
    const { preferences, setPreferences } = useAppContext();
    const [tempPreferences, setTempPreferences] = useState(preferences);
    const [email, setEmail] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const nav = useNavigate();

    console.log(preferences)

    useEffect(() => {
        async function getUser() {
            try {
                const user = await Auth.currentAuthenticatedUser();
                console.log(user);
                setEmail(user.attributes.email);
            } catch (error) {
                console.log(error);
                nav("/");
            }
        }
        getUser();
    }, [])

    return (
        <div className="Settings">
            <div className="mb-4">
                <h2>Signed in as</h2>
                <h3>{email}</h3>
            </div>
            <Form onSubmit={(event) => updateData(event, tempPreferences, setPreferences, setIsLoading)} noValidate>
                <h2>Feed Delivery</h2>
                <Form.Check
                    type="checkbox"
                    id="feedEnabled"
                    checked={Boolean(tempPreferences.feedEnabled)}
                    label={`${tempPreferences.feedEnabled ? "Enabled" : "Disabled"}`}
                    onChange={(event) => handlePrefChange(event, setTempPreferences)}
                    className="mb-4 FeedEnabled"
                />

                <h2>Your Kindle E-mail</h2>
                <InputGroup className="mb-4">
                    <Form.Control
                        size="lg"
                        type="email"
                        value={tempPreferences.kindleEmail}
                        id="kindleEmail"
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => handlePrefChange(event, setTempPreferences)}
                    />
                    <InputGroup.Text id="kindleEmail">@kindle.com</InputGroup.Text>
                </InputGroup>

                <h2>Delivery Time (EST)</h2>
                <Form.Select className="mb-4" id="fetchTime" value={tempPreferences.fetchTime} onChange={(event) => handlePrefChange(event, setTempPreferences)}>
                    {[...Array(24).keys()].map(hour => {
                        return (
                            <option key={`${hour}`} className="dropdown" value={hour}>
                                {hour === 0 ? "12 AM" : (
                                    hour < 12 ? `${hour} AM` : (
                                        hour === 12 ? "12 PM" : `${hour - 12} PM`
                                    )
                                )}
                            </option>
                        )
                    })}
                </Form.Select>
                <LoaderButton
                    type="submit"
                    variant="dark"
                    isLoading={isLoading}
                    className="mb-5 ms-auto"
                >
                    {!isLoading && "Save"}
                </LoaderButton>
            </Form>
            <h2 className="mt-5 text-center">Delete Account</h2>
        </div>
    );
}