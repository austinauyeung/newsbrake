export interface Feed {
    feedName: string;
    category: string;
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
