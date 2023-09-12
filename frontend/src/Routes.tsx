import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home";
import NotFound from "./containers/NotFound";
import Login from "./containers/Login";
import Signup from "./containers/Signup";
import Feeds from "./containers/Feeds"

export default function Links() {
    return (
        <Routes>
            <Route path="/" element={<Home />} />;
            <Route path="/login" element={<Login />} />;
            <Route path="/signup" element={<Signup />} />;
            <Route path="/feeds" element={<Feeds />} />;
            <Route path="*" element={<NotFound />} />;
        </Routes>
    );
}