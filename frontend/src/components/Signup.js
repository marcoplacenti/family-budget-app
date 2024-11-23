import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/Signup.css'; // Import the CSS file

import CustomLambdaInvocation from '../utils/CustomLambdaInvocation';

const Login = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const navigate = useNavigate();

    const lambdaInvoker = new CustomLambdaInvocation();

    const onSubmit = (event) => {
        event.preventDefault();
        
        // register
        const register = async () => {
        try {
            const functionName = "AuthenticateSignin";
            const payload = { email, password };
            const result = await lambdaInvoker.invoke(functionName, payload)
            console.log(result)
            const statusCode = result.statusCode;
            const body = JSON.parse(result.body);
            if (statusCode === 200){
                // Store tokens in session storage
                sessionStorage.setItem("idToken", body.idToken);
                sessionStorage.setItem("accessToken", body.accessToken);
                sessionStorage.setItem("refreshToken", body.refreshToken);

                // Redirect to the dashboard
                navigate("/login");
            } else {
                console.error("Login failed:", result);
                alert("Invalid email or password!");
            return result
            }
    
        } catch (error) {
            console.error("Failed to Register:", error);
        }
        };

        register();
    };

    return (
        <div className="signup-container">
            <form 
                onSubmit={onSubmit}
                className="signup-form" // Apply the class
            >
                <h2>Sign Up!</h2>
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
                    Sign Up
                </button>
            </form>
            <button className="login-button" onClick={() => navigate("/")}>
                Already have an account? Login here!
            </button>
        </div>
    );
};

export default Login;
