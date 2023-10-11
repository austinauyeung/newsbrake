import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import Settings from "./containers/Settings";
import Terms from "./containers/Terms";
import Privacy from "./containers/Privacy";

export default function Links() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />;
            <Route path="/login" element={<Login />} />;
            <Route path="/signup" element={<Signup />} />;
            <Route path="/settings" element={<Settings />} />;
            <Route path="/terms" element={<Terms />} />;
            <Route path="/privacy" element={<Privacy />} />;
            <Route path="*" element={<NotFound />} />;
        </Routes>
    );
}