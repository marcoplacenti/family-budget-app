import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Sidebar from "./components/Sidebar";
import Home from "./components/Home";
import UserSetup from "./components/UserSetup";
import Transactions from "./components/Transactions";
import Login from "./components/Login";
import Signup from "./components/Signup";

import "./styles/App.css";


function App() {
  //const [currentPage, setCurrentPage] = React.useState("overview");

  return (
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<Home />} />
            <Route path="/user-setup" element={<UserSetup />} />
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/signup" element={<Signup />} />
        </Routes>
    </BrowserRouter>
  );
}

export default App;
