import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Login.css'; // Import the CSS file

import CustomLambdaInvocation from '../utils/CustomLambdaInvocation';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const lambdaInvoker = new CustomLambdaInvocation();

    const onSubmit = (event) => {
        event.preventDefault();
        
        // Authenticate
        const authenticate = async () => {
        try {
            const functionName = "AuthenticateLogin";
            const payload = { email, password };
            const result = await lambdaInvoker.invoke(functionName, payload)
            const statusCode = result.statusCode;
            const body = JSON.parse(result.body);
            if (statusCode === 200){
                // Store tokens in session storage
                sessionStorage.setItem("idToken", body.idToken);
                sessionStorage.setItem("accessToken", body.accessToken);
                sessionStorage.setItem("refreshToken", body.refreshToken);
                
                if (body.isInitialized){
                    navigate("/home")
                } else {
                    navigate("/user-setup")
                }
            } else {
                console.error("Login failed:", result);
                alert("Invalid email or password!");
            }

    
        } catch (error) {
            console.error("Failed to authenticate:", error);
        }
        };

        authenticate();
    };

    return (
        <div className="login-container">
            <form 
                onSubmit={onSubmit}
                className="login-form" // Apply the class
            >
                <h2>Login</h2>
                <label htmlFor="email">Email</label>
                <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                />
                <label htmlFor="password">Password</label>
                <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                />
                <button type="submit">
                    Login
                </button>
            </form>
            <button className="signup-button" onClick={() => navigate("/signup")}>
                Don't you have an account? Sign up here!
            </button>
        </div>
    );
};

export default Login;
