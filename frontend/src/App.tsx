import Navbar from "react-bootstrap/Navbar";
import Routes from "./Routes";
import Nav from "react-bootstrap/Nav"
import { LinkContainer } from "react-router-bootstrap";
import { useEffect, useState } from "react";
import { AppContext, AppContextType } from "./lib/contextLib";
import { Auth } from "aws-amplify";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer, Zoom } from "react-toastify"; // or Slide
import "./App.css";
import 'react-toastify/ReactToastify.css';

function App() {
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const nav = useNavigate();
  const loc = useLocation();
  const routesToSpace = ['/login', '/signup']
  const containerClass = routesToSpace.includes(loc.pathname) ? 'container-space' : 'container-default';

  useEffect(() => {
    async function onLoad() {
      try {
        await Auth.currentSession();
        userHasAuthenticated(true);
      } catch (error) {
        if (error !== "No current user") {
          toast("Session error.", { toastId: "session" });
        }
      }
      setIsAuthenticating(false);
    }
    onLoad();
  }, []);

  async function handleLogout() {
    await Auth.signOut();
    userHasAuthenticated(false);
    nav("/login");
  }

  return (
    !isAuthenticating && (
      <div className={`App container py-3 ${containerClass}`}>
        <Navbar collapseOnSelect bg="none" expand="md" className="mb-0 px-0">
          <LinkContainer to="/">
            <Navbar.Brand className="fw-bold NavbarBrand">
              <img src="/logo.svg" height="60" className="d-inline-block align-top" />
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav activeKey={window.location.pathname}>
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
          </Navbar.Collapse >
        </Navbar >

        <div className="center-container">
          <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated } as AppContextType}>
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
