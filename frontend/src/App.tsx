import Routes from "./Routes";
import { Navbar, Nav, Offcanvas } from "react-bootstrap";
import { LinkContainer } from "react-router-bootstrap";
import { useEffect, useState } from "react";
import { AppContext, AppContextType } from "./lib/contextLib";
import { API, Auth } from "aws-amplify";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify"; // or Slide
import { Feed, Preferences } from "./lib/types";
import * as AWS from 'aws-sdk';

import "./App.css";
import 'react-toastify/ReactToastify.css';

function App() {
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const nav = useNavigate();
  const loc = useLocation();
  const routesToSpace = ['/login', '/signup']
  const containerClass = routesToSpace.includes(loc.pathname) ? 'container-space' : 'container-default';

  const [metadata, setMetadata] = useState<Feed[]>(() => {
    const storedMetadata = localStorage.getItem('metadata');
    return storedMetadata ? JSON.parse(storedMetadata) : [];
  });

  const [preferences, setPreferences] = useState(() => {
    const storedPreferences = localStorage.getItem('preferences');
    return storedPreferences ? JSON.parse(storedPreferences) : {};
  });

  useEffect(() => {
    async function onLoad() {
      try {
        await Auth.currentSession();
        userHasAuthenticated(true);
      } catch (error) {
        console.log(error);
        if (error !== "No current user") {
          toast("Session error.", { toastId: "session" });
        }
      }
      setIsAuthenticating(false);
    }
    onLoad();
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData()
    }
  }, [isAuthenticated])

  async function fetchData() {
    try {
      const [metadataResponse, preferencesResponse] = await Promise.all([
        API.get("RestApi", "metadata", {}),
        API.get("RestApi", "preferences", {})
      ]);
      const fetchedMetadata = metadataResponse.data.Items;
      const fetchedPreferences = AWS.DynamoDB.Converter.unmarshall(preferencesResponse.data.Item);
      const updatedFeeds = { ...fetchedPreferences.feeds };

      fetchedMetadata.forEach((feed: Feed) => {
        // create user preferences for newly added feeds
        if (!(feed.feedName in updatedFeeds)) {
          updatedFeeds[feed.feedName] = {}
        }

        // create user preferences for newly added subfeeds
        Object.keys(feed.subfeeds).forEach(subfeed => {
          if (!(subfeed in updatedFeeds[feed.feedName])) {
            updatedFeeds[feed.feedName][subfeed] = 0
          }
        })
      });

      const updatedPreferences = {
        ...fetchedPreferences,
        feeds: updatedFeeds
      } as Preferences;
      console.log(fetchedMetadata);
      console.log(updatedPreferences);
      setMetadata(fetchedMetadata);
      setPreferences(updatedPreferences);
      localStorage.setItem('metadata', JSON.stringify(fetchedMetadata));
      localStorage.setItem('preferences', JSON.stringify(updatedPreferences));
    } catch (error) {
      console.log(error);
    }
  }

  async function handleLogout() {
    await Auth.signOut();
    userHasAuthenticated(false);
    nav("/login");
    setMetadata([]);
    setPreferences({});
    localStorage.removeItem('metadata');
    localStorage.removeItem('preferences');
  }

  function navComponent() {
    return (
      <Nav className="ms-auto" activeKey={window.location.pathname}>
        {isAuthenticated ? (
          <>
            <LinkContainer to="/">
              <Nav.Link>Feeds</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/settings">
              <Nav.Link>Settings</Nav.Link>
            </LinkContainer>
            <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
          </>
        ) : (
          <>
            <LinkContainer to="/signup">
              <Nav.Link>Signup</Nav.Link>
            </LinkContainer>
            <LinkContainer to="/login">
              <Nav.Link>Login</Nav.Link>
            </LinkContainer>
          </>
        )}
      </Nav>
    )
  }

  return (
    !isAuthenticating && (
      <div className={`App container py-3 ${containerClass}`}>
        <Navbar bg="none" className="mb-0 px-0 d-none d-md-flex">
          <LinkContainer to="/">
            <Navbar.Brand className="fw-bold NavbarBrand">
              <img src="/logo.svg" height="60" className="d-inline-block align-top" />
            </Navbar.Brand>
          </LinkContainer>
          {navComponent()}
        </Navbar >

        <Navbar bg="none" expand={false} className="mb-0 px-0 d-md-none">
          <LinkContainer to="/">
            <Navbar.Brand className="fw-bold NavbarBrand">
              <img src="/logo.svg" height="60" className="d-inline-block align-top" />
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle />
          <Navbar.Offcanvas id="navbarOffcanvas" placement="end">
            <Offcanvas.Header closeButton>
              <Offcanvas.Title id='offcanvasLabel'>
                Menu
              </Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              {navComponent()}
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Navbar>

        <div className="center-container">
          <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated, metadata, preferences, setPreferences } as AppContextType}>
            <Routes />
          </AppContext.Provider>
        </div>

        <div className="spacer-container"></div>

        <ToastContainer
          position="top-center"
          autoClose={2000}
          hideProgressBar
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Zoom}
        />
      </div >
    )
  );
}
export default App;
