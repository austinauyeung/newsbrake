import Navbar from "react-bootstrap/Navbar";
import Routes from "./Routes.tsx";
import Nav from "react-bootstrap/Nav"
import { LinkContainer } from "react-router-bootstrap";
import { useEffect, useState } from "react";
import { AppContext, AppContextType } from "./lib/contextLib.ts";
import { Auth } from "aws-amplify";
import { useNavigate } from "react-router-dom";
import { onError } from "./lib/errorLib.ts";
import { ToastContainer, Slide, Zoom } from "react-toastify";
import "./App.css";
import 'react-toastify/ReactToastify.css';

function App() {
  const [isAuthenticated, userHasAuthenticated] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    onLoad();
  }, []);

  async function onLoad() {
    try {
      await Auth.currentSession();
      userHasAuthenticated(true);
    } catch (error) {
      if (error !== "No current user") {
        onError(error);
      }
    }
    setIsAuthenticating(false);
  }

  async function handleLogout() {
    await Auth.signOut();
    userHasAuthenticated(false);
    nav("/login");
  }

  return (
    !isAuthenticating && (
      <div className="App container py-3">
        <Navbar collapseOnSelect bg="none" expand="md" className="mb-3 px-3">
          <LinkContainer to="/">
            <Navbar.Brand className="fw-bold NavbarBrand">
              <img src="/logo.svg" height="50" className="d-inline-block align-top" />
            </Navbar.Brand>
          </LinkContainer>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav activeKey={window.location.pathname}>
              {isAuthenticated ? (
                <>
                  <LinkContainer to="/feeds">
                    <Nav.Link>Feeds</Nav.Link>
                  </LinkContainer>
                  <LinkContainer to="/settings">
                    <Nav.Link>Settings</Nav.Link>
                  </LinkContainer>
                  <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
                </>
                // <Nav.Link onClick={handleLogout}>Logout</Nav.Link>
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

        <AppContext.Provider value={{ isAuthenticated, userHasAuthenticated } as AppContextType}>
          <Routes />
        </AppContext.Provider>

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
