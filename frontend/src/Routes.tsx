import { Route, Routes } from "react-router-dom";
import Home from "./containers/Home.tsx";
import NotFound from "./containers/NotFound.tsx";
import Login from "./containers/Login.tsx";
import Signup from "./containers/Signup.tsx";
import Feeds from "./containers/Feeds.tsx"

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