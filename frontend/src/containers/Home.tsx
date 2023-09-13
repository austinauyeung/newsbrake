import "./Home.css";
import { useAppContext } from "../lib/contextLib";
import { useEffect } from "react";
import { API } from "aws-amplify";

export default function Home() {
    const { isAuthenticated } = useAppContext();

    useEffect(() => {
        async function onLoad() {
            if (!isAuthenticated) {
                return;
            }

            try {
                const [metadataResponse, preferencesResponse] = await Promise.all([
                    API.get("RestApi", "metadata", {}),
                    API.get("RestApi", "preferences", {}),
                ]);
                console.log(metadataResponse);
                console.log(preferencesResponse);
            } catch (error) {
                console.log(error);
            }
        }
        onLoad();
    })

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
                    <a>About</a>
                    <a>FAQs</a>
                    <a>GitHub</a>
                </div>
            </>
        );
    }

    function renderFeeds() {
        return (
            <div className="Feeds">
                <h1>Feeds</h1>
            </div>
        )
    }

    return (
        <div className="Home">
            {isAuthenticated ? renderFeeds() : renderLander()}
        </div>
    );

}
