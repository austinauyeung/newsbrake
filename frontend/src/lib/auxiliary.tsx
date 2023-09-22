import { API, Auth } from "aws-amplify";
import { toast } from "react-toastify";
import { Feed, Preferences, FieldsType } from "./types";
import { NavigateFunction } from "react-router-dom";
import { Form, Stack } from "react-bootstrap"
import LoaderButton from "../components/LoaderButton";

export async function putData(event: React.FormEvent<HTMLFormElement>, tempPreferences: Preferences, setPreferences: React.Dispatch<React.SetStateAction<Preferences>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
    event.preventDefault();

    if (!(/^[a-zA-Z0-9\-_.]+$/.test(tempPreferences.kindleEmail))) {
        toast.error('The Kindle e-mail address is not valid.')
        return;
    }

    setIsLoading(true);

    try {
        console.log(tempPreferences)
        const token = (await Auth.currentSession()).getIdToken().getJwtToken();
        const response = await API.put("HttpApi", "preferences", {
            body: tempPreferences,
            headers: {
                Authorization: `Bearer ${token}`,
            }
        })
        console.log(response);
        toast.info("Preferences saved.", { toastId: "saved" })
        setPreferences(tempPreferences);
        localStorage.setItem('preferences', JSON.stringify(tempPreferences));
    } catch (error) {
        console.log(error);
    }
    setIsLoading(false);
}

export async function deleteData(setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
    setIsLoading(true);
    console.log('deleting')
    const token = (await Auth.currentSession()).getIdToken().getJwtToken();
    try {
        await API.del("HttpApi", "preferences", {
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
        await Auth.deleteUser();
        toast("Your account has been deleted.", { toastId: "deleted" })
    } catch (error) {
        console.log(error);
    }
    setIsLoading(false);
}

export async function handleLogout(
    userHasAuthenticated: React.Dispatch<React.SetStateAction<boolean>>,
    setMetadata: React.Dispatch<React.SetStateAction<Feed[]>>,
    setPreferences: React.Dispatch<any>,
    nav: NavigateFunction
) {
    await Auth.signOut();
    userHasAuthenticated(false);
    setMetadata([]);
    setPreferences({});
    localStorage.removeItem('metadata');
    localStorage.removeItem('preferences');
    nav("/");
}

export function validateForm(fields: FieldsType, loginState: string) {
    switch (loginState) {
        case 'signup':
            return (
                fields.email.length > 0 &&
                fields.password.length > 0 &&
                fields.password == fields.confirmPassword &&
                validPassword(fields.password)
            );
        case 'signupConfirm':
            return fields.confirmationCode.length > 0;
        case 'login':
            return fields.email.length > 0 && fields.password.length > 0;
        case 'reset':
            return fields.email.length > 0
        case 'resetConfirm':
            return fields.password.length > 0 && fields.password == fields.confirmPassword && fields.confirmationCode.length > 0 && validPassword(fields.password)
        default:
            return false;
    }
}

export function validPassword(password: string) {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[\^$*.\[\]{}\(\)?\-“!@#%&/,><\’:;|_~`])\S{8,99}$/.test(password);
}

async function handleConfirmationSubmit(
    event: React.FormEvent<HTMLFormElement>,
    nav: NavigateFunction,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    userHasAuthenticated: React.Dispatch<React.SetStateAction<boolean>>,
    fields: FieldsType
) {
    event.preventDefault();
    setIsLoading(true);
    try {
        await Auth.confirmSignUp(fields.email, fields.confirmationCode);
        await Auth.signIn(fields.email, fields.password);
        userHasAuthenticated(true);
        nav("/");
    } catch (error: any) {
        switch (error.code) {
            case "CodeMismatchException":
                toast.error("Invalid confirmation code.")
                break;
            default:
                toast.error("Confirmation error.")
                break;
        }
    }
    setIsLoading(false);
}

export function renderConfirmationForm(
    nav: NavigateFunction,
    isLoading: boolean,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    userHasAuthenticated: React.Dispatch<React.SetStateAction<boolean>>,
    fields: FieldsType,
    handleFieldChange: React.ChangeEventHandler
) {
    return (
        <div className="Signup">
            <Form onSubmit={(event) => handleConfirmationSubmit(event, nav, setIsLoading, userHasAuthenticated, fields)}>
                <Stack gap={1}>
                    <Form.Group controlId="confirmationCode">
                        <Form.Label>Confirmation Code</Form.Label>
                        <Form.Control
                            size="lg"
                            autoFocus
                            type="tel"
                            onChange={handleFieldChange}
                            value={fields.confirmationCode}
                        />
                        <Form.Text muted>Please check your email for the code.</Form.Text>
                    </Form.Group>
                    <LoaderButton
                        size="lg"
                        type="submit"
                        variant="dark"
                        isLoading={isLoading}
                        disabled={!validateForm(fields, 'signupConfirm')}
                    >
                        {!isLoading && "Verify"}
                    </LoaderButton>
                </Stack>
            </Form>
        </div>
    );
}