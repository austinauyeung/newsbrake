import { useState, ChangeEvent, ChangeEventHandler } from "react";
import { Preferences } from "./types";

interface FieldsType {
    [key: string | symbol]: string;
}

export function useFormFields(
    initialState: FieldsType
): [FieldsType, ChangeEventHandler] {
    const [fields, setValues] = useState(initialState);

    return [
        fields,
        function (event: ChangeEvent<HTMLInputElement>) {
            setValues({
                ...fields,
                [event.target.id]: event.target.value,
            });
            return;
        }
    ];
}

export function handleSubfeedChange(event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | any, setPreferences: React.Dispatch<React.SetStateAction<Preferences>>, feedName = '', subfeed = '') {
    setPreferences(prevPreferences => {
        let newPreferences = { ...prevPreferences };

        switch (event.target.id) {
            case subfeed:
                const updatedFeeds = { ...prevPreferences.feeds[feedName] }
                for (const key in updatedFeeds) {
                    updatedFeeds[key] = 0
                }
                updatedFeeds[subfeed] = prevPreferences.feeds[feedName][subfeed] === 1 ? 0 : 1;

                newPreferences = {
                    ...prevPreferences,
                    feeds: {
                        ...prevPreferences.feeds,
                        [feedName]: updatedFeeds
                    }
                };
                break;
            case "kindleEmail":
                newPreferences = {
                    ...prevPreferences,
                    kindleEmail: event.target.value
                };
                break;
            case "feedEnabled":
                newPreferences = {
                    ...prevPreferences,
                    feedEnabled: Number(!prevPreferences.feedEnabled)
                };
                break;
            case "fetchTime":
                newPreferences = {
                    ...prevPreferences,
                    fetchTime: Number(event.target.value)
                };
                break;
            default:
                console.log("Error updating preferences.")
                break;
        }
        console.log(newPreferences)
        return newPreferences;
    });
}
