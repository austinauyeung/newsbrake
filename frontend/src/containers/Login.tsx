import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import { Auth } from "aws-amplify";
import { useAppContext } from "../lib/contextLib";
import { useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { useFormFields } from "../lib/hooksLib";
import { toast } from "react-toastify";
import "./Login.css";
import { MotionDiv } from "../Motion";

export default function Login() {
    const { userHasAuthenticated, isAuthenticated } = useAppContext();
    const [fields, handleFieldChange] = useFormFields({
        email: "",
        password: "",
    })

    const [isLoading, setIsLoading] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            nav("/");
        }
    }, [])

    function validateForm() {
        return fields.email.length > 0 && fields.password.length > 0;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        try {
            await Auth.signIn(fields.email, fields.password);
            userHasAuthenticated(true);
            nav("/");
            // toast("Login successful.", { toastId: "login" })
        } catch (error: any) {
            toast.error(error.message);
        }
        setIsLoading(false);
    }

    return (
        <MotionDiv variant="fadeIn" delay={0.1} className="Login">
            <h1>Welcome back.</h1>
            <Form onSubmit={handleSubmit} noValidate>
                <Stack gap={1}>
                    <Form.Group controlId="email">
                        {/* <Form.Label>E-mail</Form.Label> */}
                        <Form.Control
                            autoFocus
                            size="lg"
                            type="email"
                            value={fields.email}
                            onChange={handleFieldChange}
                            placeholder="E-mail"
                        />
                    </Form.Group>

                    <Form.Group controlId="password">
                        {/* <Form.Label>Password</Form.Label> */}
                        <Form.Control
                            size="lg"
                            type="password"
                            value={fields.password}
                            onChange={handleFieldChange}
                            placeholder="Password"
                        />
                    </Form.Group>
                    <LoaderButton
                        size="lg"
                        type="submit"
                        variant="dark"
                        isLoading={isLoading}
                        disabled={!validateForm()}
                    >
                        {!isLoading && "Login"}
                    </LoaderButton>
                </Stack>
            </Form>
        </MotionDiv>
    )
}