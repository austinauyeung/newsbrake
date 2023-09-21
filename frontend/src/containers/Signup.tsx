import React, { useState, useEffect } from "react";
import { Form, Stack } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { useFormFields } from "../lib/hooksLib";
import { useAppContext } from "../lib/contextLib";
import LoaderButton from "../components/LoaderButton";
import { Auth } from "aws-amplify";
import { ISignUpResult } from "amazon-cognito-identity-js";
import { toast } from "react-toastify";
import "./Signup.css";
import { MotionDiv } from "../Motion";
import { validPassword, validateForm, renderConfirmationForm } from "../lib/auxiliary";

export default function Signup() {
    const [fields, handleFieldChange] = useFormFields({
        email: "",
        password: "",
        confirmPassword: "",
        confirmationCode: "",
    });

    const nav = useNavigate();
    const { userHasAuthenticated, isAuthenticated } = useAppContext();
    const [isLoading, setIsLoading] = useState(false);
    const [newUser, setNewUser] = useState<null | ISignUpResult | string>(null);

    useEffect(() => {
        if (isAuthenticated) {
            nav("/");
        }
    }, [])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        try {
            const newUser = await Auth.signUp({
                username: fields.email,
                password: fields.password,
            });
            setNewUser(newUser);
        } catch (error: any) {
            toast.error("There was an issue with your signup. If you already have an account, please log in.")
        }

        setIsLoading(false);
    }

    function renderForm() {
        return (
            <MotionDiv variant="fadeIn" delay={0.1} className="Signup">
                <h1>Welcome.</h1>
                <div>
                    <Form onSubmit={handleSubmit}>
                        <Stack gap={1}>
                            <Form.Group controlId="email">
                                {/* <Form.Label>Email</Form.Label> */}
                                <Form.Control
                                    size="lg"
                                    autoFocus
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
                            <Form.Group controlId="confirmPassword">
                                {/* <Form.Label>Confirm Password</Form.Label> */}
                                <Form.Control
                                    size="lg"
                                    type="password"
                                    value={fields.confirmPassword}
                                    onChange={handleFieldChange}
                                    placeholder="Confirm Password"
                                />
                            </Form.Group>
                            {!validPassword(fields.password) && fields.password.length > 0 && <Form.Text muted>Password must have a minimum length of 8 and contain a number, a special character, an uppercase letter, and a lowercase letter.</Form.Text>}
                            {(validPassword(fields.password) && fields.password.length > 0 && fields.password !== fields.confirmPassword) && <Form.Text muted>Passwords must match.</Form.Text>}
                            <LoaderButton
                                size="lg"
                                type="submit"
                                variant="dark"
                                isLoading={isLoading}
                                disabled={!validateForm(fields, 'signup')}
                            >
                                {!isLoading && "Signup"}
                            </LoaderButton>
                        </Stack>
                    </Form>
                </div>
            </MotionDiv>
        );
    }

    return (
        <>
            {newUser === null ? renderForm() : renderConfirmationForm(nav, isLoading, setIsLoading, userHasAuthenticated, fields, handleFieldChange)}
        </>
    );
}