import { Auth } from "aws-amplify";
import "./Settings.css";
import { useState, useEffect } from "react";
import { Form, InputGroup, Modal, Button } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { useAppContext } from "../lib/contextLib";
import { handlePrefChange } from "../lib/hooksLib";
import { putData, deleteData, handleLogout } from "../lib/auxiliary"
import { useNavigate } from "react-router-dom";

export default function Settings() {
    const { userHasAuthenticated, setMetadata, preferences, setPreferences } = useAppContext();
    const [tempPreferences, setTempPreferences] = useState(preferences);
    const [email, setEmail] = useState(null);
    const [isLoadingPref, setIsLoadingPref] = useState(false);
    const [isLoadingDelete, setIsLoadingDelete] = useState(false);
    const nav = useNavigate();
    const [showDelete, setShowDelete] = useState(false);
    const handleCloseDelete = () => setShowDelete(false);
    const handleShowDelete = () => setShowDelete(true);
    const [showSend, setShowSend] = useState(false);
    const handleCloseSend = () => setShowSend(false);
    const handleShowSend = () => setShowSend(true);

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
            <Form onSubmit={(event) => putData(event, tempPreferences, setPreferences, setIsLoadingPref)} noValidate>
                <h2>Feed Delivery</h2>
                <Form.Check
                    type="checkbox"
                    id="feedEnabled"
                    checked={Boolean(tempPreferences.feedEnabled)}
                    label={`${tempPreferences.feedEnabled ? "Enabled" : "Disabled"}`}
                    onChange={(event) => {
                        handlePrefChange(event, setTempPreferences)
                        if (event.target.checked) {
                            handleShowSend()
                        }
                    }}
                    className="mb-4 FeedEnabled"
                />
                <Modal show={showSend} onHide={handleCloseSend}>
                    <Modal.Header closeButton>
                        <Modal.Title>Authorize newsbrake</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>Please add @newsbrake.app to your <a href="https://www.amazon.com/gp/help/customer/display.html?nodeId=GX9XLEVV8G4DB28H" target="_blank" rel="noopener noreferrer">Approved Personal Document E-mail List</a>.</Modal.Body>
                    <Modal.Footer>
                        <Button variant="dark" onClick={handleCloseSend}>Close</Button>
                    </Modal.Footer>
                </Modal>

                <h2>Your Send-to-Kindle E-mail</h2>
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

                <h2>Delivery Time (Eastern Time)</h2>
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
                    isLoading={isLoadingPref}
                    className="mb-5 ms-auto"
                >
                    {!isLoadingPref && "Save"}
                </LoaderButton>
            </Form>
            <h2 className="mt-5 text-center Delete" onClick={handleShowDelete}>Delete Account</h2>
            <Modal className="DeleteModal" show={showDelete} onHide={handleCloseDelete}>
                <Modal.Header closeButton>
                    <Modal.Title>Delete Account</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to delete your account? Your account data will be deleted immediately.</Modal.Body>
                <Modal.Footer>
                    <Button variant="light" onClick={handleCloseDelete}>Cancel</Button>
                    <Form onSubmit={async (event) => {
                        event.preventDefault();
                        await deleteData(setIsLoadingDelete);
                        handleLogout(userHasAuthenticated, setMetadata, setPreferences, nav);
                    }}>
                        <LoaderButton
                            type="submit"
                            variant="dark"
                            isLoading={isLoadingDelete}
                        >
                            {!isLoadingDelete && "Delete"}
                        </LoaderButton>
                    </Form>
                </Modal.Footer>
            </Modal>
        </div>
    );
}