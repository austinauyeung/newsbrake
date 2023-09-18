import { createContext, useContext } from "react";
import { Feed, Preferences } from "./types";

export interface AppContextType {
    isAuthenticated: boolean;
    userHasAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
    metadata: Feed[];
    setMetadata: React.Dispatch<React.SetStateAction<Feed[]>>;
    preferences: Preferences;
    setPreferences: React.Dispatch<React.SetStateAction<Preferences>>;
}

export const AppContext = createContext<AppContextType>({
    isAuthenticated: false,
    userHasAuthenticated: () => { },
    metadata: [],
    setMetadata: () => { },
    preferences: {
        feedEnabled: 0,
        feeds: {},
        fetchTime: 6,
        kindleEmail: ''
    },
    setPreferences: () => { },
});

export function useAppContext() {
    return useContext(AppContext);
}