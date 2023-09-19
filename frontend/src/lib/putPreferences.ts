import { API } from "aws-amplify";
import { toast } from "react-toastify";
import { Preferences } from "../lib/types";

export default async function updateData(event: React.FormEvent<HTMLFormElement>, tempPreferences: Preferences, setPreferences: React.Dispatch<React.SetStateAction<Preferences>>, setIsLoading: React.Dispatch<React.SetStateAction<boolean>>) {
    event.preventDefault();
    setIsLoading(true);

    try {
        console.log(tempPreferences)
        const response = await API.put("RestApi", "preferences", {
            body: tempPreferences
        })
        console.log(response);
        toast("Preferences saved.", { toastId: "saved" })
    } catch (error) {
        console.log(error);
    }
    setIsLoading(false);
    setPreferences(tempPreferences);
    localStorage.setItem('preferences', JSON.stringify(tempPreferences));
}