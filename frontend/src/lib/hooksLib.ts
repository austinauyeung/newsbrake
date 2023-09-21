import { useState, ChangeEvent, ChangeEventHandler } from "react";
import { Preferences, FieldsType } from "./types";

export function useFormFields(
    initialState: FieldsType
): [FieldsType, ChangeEventHandler, (key: string, value: string) => void] {
    const [fields, setValues] = useState(initialState);

    return [
        fields,
        function (event: ChangeEvent<HTMLInputElement>) {
            setValues({
                ...fields,
                [event.target.id]: event.target.value,
            });
        },
        function (key: string, value: string) {
            setValues(prevFields => ({
                ...prevFields,
                [key]: value
            }));
        }
    ];
}

export function handlePrefChange(event: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLSelectElement> | any, setPreferences: React.Dispatch<React.SetStateAction<Preferences>>, feedName = '', subfeed = '') {
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
