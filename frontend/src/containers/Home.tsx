import "./Home.css";
import { useAppContext } from "../lib/contextLib";
import { useEffect, useState } from "react";
import { API } from "aws-amplify";
import { Accordion, Form } from "react-bootstrap";
import * as AWS from 'aws-sdk';
import { toast } from "react-toastify";
import LoaderButton from "../components/LoaderButton";
import { Feed, Preferences } from "../lib/types";

export default function Home() {
    const { isAuthenticated, metadata, preferences, setPreferences } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);

    const categories = metadata.reduce((acc, feed) => {
        if (!acc[feed.category]) {
            acc[feed.category] = [];
        }
        acc[feed.category].push({
            feedName: feed.feedName,
            subfeeds: feed.subfeeds
        });
        return acc;
    }, {} as Record<string, { feedName: string, subfeeds: Record<string, string> }[]>)

    function handleCheckboxChange(feedName: string, subfeed: string) {
        setPreferences(prevPreferences => {
            const updatedFeeds = { ...prevPreferences.feeds[feedName] }
            for (const key in updatedFeeds) {
                updatedFeeds[key] = 0
            }
            updatedFeeds[subfeed] = prevPreferences.feeds[feedName][subfeed] === 1 ? 0 : 1;

            const newPreferences = {
                ...prevPreferences,
                feeds: {
                    ...prevPreferences.feeds,
                    [feedName]: updatedFeeds
                }
            }
            console.log(newPreferences)
            return newPreferences;
        });
    }

    async function updateData(event: React.FormEvent<HTMLFormElement>, preferences: Preferences) {
        event.preventDefault();
        setIsLoading(true);

        try {
            console.log(preferences)
            const response = await API.put("RestApi", "preferences", {
                body: preferences
            })
            console.log(response);
            toast("Preferences saved.", { toastId: "saved" })
        } catch (error) {
            console.log(error);
        }
        setIsLoading(false);
        localStorage.setItem('preferences', JSON.stringify(preferences));
    }

    function renderLander() {
        return (
            <>
                <div className="Lander">
                    <div className="Reason">
                        <h1>Reevaluating the Modern News Cycle</h1>
                        <p>In the digital age, the velocity of news dissemination has accelerated dramatically. newsbrake offers a counterpoint: a platform dedicated to a slower, thoughtful consumption of news on your Kindle device. By emphasizing comprehensive research and nuanced perspectives, we provide readers an opportunity to pause, understand, and engage deeply with the events that shape our world.</p>
                    </div>
                    <div className="Reason">
                        <h1>Delving Deeper than Headlines</h1>
                        <p>The depth of a story is seldom captured in its headline. Every piece of news holds value beyond its immediacy, and as a conduit between reputable independent journalism outlets and the discerning reader, newsbrake aims to facilitate a return to the core tenets of journalism — accuracy, fairness, and depth.</p>
                    </div>
                    <div className="Reason">
                        <h1>The Role of Independent Journalism</h1>
                        <p>In the current media landscape, distinguishing signal from noise has never been more critical. newsbrake underscores the importance of journalism that operates independently from commercial or political pressures and sources its material from outlets that utilize Creative Commons licensing. By championing content under this license, newsbrake provides readers with reliable and objective content that is accessible to all.</p>
                    </div>
                </div>
                <div className="bottom-container">
                    <a>Terms of Service</a>
                    <a>Privacy Policy</a>
                    <a>About</a>
                    <a>FAQs</a>
                    <a>GitHub</a>
                </div>
            </>
        );
    }

    function renderFeeds(categories: Record<string, { feedName: string, subfeeds: Record<string, string> }[]>) {
        return (
            <div className="Feeds">
                <h1>Feed Preferences</h1>
                {Object.keys(preferences).length > 0 && (
                    <Form onSubmit={(event) => updateData(event, preferences)}>
                        <Accordion alwaysOpen>
                            {Object.entries(categories).map(([category, feeds], index) => (
                                <Accordion.Item key={category} eventKey={index.toString()}>
                                    <Accordion.Header>{category}</Accordion.Header>
                                    <Accordion.Body>
                                        {feeds.map(feed => {
                                            const { feedName } = feed;
                                            return (
                                                <div key={feedName} className="AccordionFeed">
                                                    {feedName}
                                                    {Object.keys(feed.subfeeds).map(subfeed => (
                                                        <Form.Check
                                                            className=".custom-border-radius"
                                                            type='checkbox'
                                                            id={subfeed}
                                                            label={subfeed}
                                                            key={subfeed}
                                                            checked={preferences.feeds[feed.feedName][subfeed] === 1}
                                                            onChange={() => handleCheckboxChange(feed.feedName, subfeed)}
                                                        />
                                                    ))}
                                                </div>
                                            )
                                        })}
                                    </Accordion.Body>
                                </Accordion.Item>
                            ))}
                        </Accordion>
                        <LoaderButton
                            // size="lg"
                            type="submit"
                            variant="dark"
                            isLoading={isLoading}
                            className="mt-3 float-end"
                        >
                            {!isLoading && "Save"}
                        </LoaderButton>
                    </Form>
                )}
            </div>
        )
    }

    return (
        <div className="Home">
            {isAuthenticated ? renderFeeds(categories) : renderLander()}
        </div>
    );

}
