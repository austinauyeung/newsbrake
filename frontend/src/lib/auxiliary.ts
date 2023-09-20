import { API, Auth } from "aws-amplify";
import { toast } from "react-toastify";
import { Feed, Preferences } from "./types";
import { NavigateFunction } from "react-router-dom";

export async function putData(event: React.FormEvent<HTMLFormElement>, tempPreferences: Preferences, setPreferences: React.Dispatch<React.SetStateAction<Preferences>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
    event.preventDefault();

    if (!(/^[a-zA-Z0-9\-_.]+$/.test(tempPreferences.kindleEmail))) {
        toast.error('The Kindle e-mail address is not valid.')
        return;
    }

    setIsLoading(true);

    try {
        console.log(tempPreferences)
        const response = await API.put("RestApi", "preferences", {
            body: tempPreferences
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
    try {
        await API.del("RestApi", "preferences", {});
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