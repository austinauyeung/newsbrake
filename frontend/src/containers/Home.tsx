import "./Home.css";
import { useAppContext } from "../lib/contextLib";
import { useEffect, useState } from "react";
import { Accordion, Form } from "react-bootstrap";
import LoaderButton from "../components/LoaderButton";
import { putData } from "../lib/auxiliary"
import { handlePrefChange } from "../lib/hooksLib";
import { Category } from "../lib/types";
import Footer from "./Footer";
import { MotionDiv } from "../Motion";

export default function Home() {
    const { isAuthenticated, metadata, preferences, setPreferences } = useAppContext();
    const [tempPreferences, setTempPreferences] = useState(preferences);
    const [isLoading, setIsLoading] = useState(false);

    const categories = metadata.reduce((acc, feed) => {
        if (!acc[feed.category]) {
            acc[feed.category] = [];
        }
        acc[feed.category].push({
            feedName: feed.feedName,
            subfeeds: feed.subfeeds,
            url: feed.url,
            logo: feed.logo
        });
        return acc;
    }, {} as Record<string, Category[]>)

    useEffect(() => {
        console.log(metadata)
        console.log(categories)
        console.log(preferences)
        console.log(tempPreferences)
        setTempPreferences(preferences)
    }, [preferences])

    function renderLander() {
        return (
            <>
                <div className="Lander">
                    <MotionDiv variant="fadeIn" delay={0.2} className="Reason">
                        <h1>Reevaluating the Modern News Cycle</h1>
                        <p>In the digital age, the velocity of news dissemination has accelerated dramatically. newsbrake offers a counterpoint: a platform dedicated to a slower, thoughtful consumption of news on your Kindle device. By emphasizing comprehensive research and nuanced perspectives, we provide readers an opportunity to pause, understand, and engage deeply with the events that shape our world.</p>
                    </MotionDiv>
                    <MotionDiv variant="fadeIn" delay={0.8} className="Reason">
                        <h1>Delving Deeper than Headlines</h1>
                        <p>The depth of a story is seldom captured in its headline. Every piece of news holds value beyond its immediacy, and as a conduit between reputable independent journalism outlets and the discerning reader, newsbrake aims to facilitate a return to the core tenets of journalism — accuracy, fairness, and depth.</p>
                    </MotionDiv>
                    <MotionDiv variant="fadeIn" delay={1.4} className="Reason">
                        <h1>The Role of Independent Journalism</h1>
                        <p>In the current media landscape, distinguishing signal from noise has never been more critical. newsbrake underscores the importance of journalism that operates independently from commercial or political pressures and sources its material from outlets that utilize Creative Commons licensing. By championing content under this license, newsbrake provides readers with reliable and objective content that is accessible to all.</p>
                    </MotionDiv>
                </div>
            </>
        );
    }

    function renderFeeds(categories: Record<string, Category[]>) {
        return (
            <MotionDiv variant="fadeIn" delay={0.1} className="Feeds">
                <h1>Feed Preferences</h1>
                {Object.keys(tempPreferences).length > 0 && (
                    !preferences.feedEnabled ? <p>To view your preferences, please enable your feed in settings.</p>
                        :
                        <Form onSubmit={(event) => putData(event, tempPreferences, setPreferences, setIsLoading)}>
                            <Accordion alwaysOpen>
                                {Object.entries(categories).map(([category, feeds], index) => (
                                    <Accordion.Item key={category} eventKey={index.toString()}>
                                        <Accordion.Header>{category}</Accordion.Header>
                                        <Accordion.Body>
                                            {feeds.map(feed => {
                                                const { feedName } = feed;
                                                return (
                                                    <div key={feedName} className="AccordionFeed">
                                                        {feed?.logo ? <a href={feed.url} target="_blank" rel="noopener noreferrer"><img src={feed.logo} className={
                                                            `${feedName === 'KFF Health News' ? 'logo1' : 'logo2'}`} /></a>
                                                            : feedName}
                                                        {Object.keys(feed.subfeeds).map(subfeed => (
                                                            <Form.Check
                                                                type='checkbox'
                                                                id={subfeed}
                                                                label={subfeed}
                                                                key={subfeed}
                                                                checked={tempPreferences.feeds[feed.feedName][subfeed] === 1}
                                                                onChange={(event) => handlePrefChange(event, setTempPreferences, feed.feedName, subfeed)}
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
                                className="mt-3 ms-auto"
                            >
                                {!isLoading && "Save"}
                            </LoaderButton>
                        </Form>
                )}
            </MotionDiv>
        )
    }

    return (
        <div className="Home">
            {isAuthenticated ? renderFeeds(categories)
                :
                <>
                    {renderLander()}
                    {Footer()}
                </>
            }
        </div>
    );

}
