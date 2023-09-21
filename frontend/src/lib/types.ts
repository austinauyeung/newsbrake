export interface Feed {
    feedName: string;
    category: string;
    url: string;
    logo: string;
    subfeeds: Record<string, string>;
}
export interface Category {
    feedName: string;
    url: string;
    logo: string;
    subfeeds: Record<string, string>;
}

export interface SubfeedPreferences {
    [subfeedName: string]: number;
}

export interface Preferences {
    feedEnabled: number,
    feeds: {
        [feedName: string]: SubfeedPreferences
    },
    fetchTime: number,
    kindleEmail: string,
}

export interface FieldsType {
    [key: string | symbol]: string;
}
