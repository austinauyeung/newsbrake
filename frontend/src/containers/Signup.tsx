import React, { useState, useEffect } from "react";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import { useNavigate } from "react-router-dom";
import { useFormFields } from "../lib/hooksLib";
import { useAppContext } from "../lib/contextLib";
import LoaderButton from "../components/LoaderButton";
import { Auth } from "aws-amplify";
import { ISignUpResult } from "amazon-cognito-identity-js";
import { toast } from "react-toastify";
import "./Signup.css";

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

    function validateForm() {
        return (
            fields.email.length > 0 &&
            fields.password.length > 0 &&
            fields.password == fields.confirmPassword
        );
    }

    function validateConfirmationForm() {
        return fields.confirmationCode.length > 0;
    }

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
            console.log(error);
            if (error.code === "UsernameExistsException") {

                try {
                    toast.info("Confirmation resent. You may have to reset your password.")
                    const resend = await Auth.resendSignUp(fields.email);
                    console.log(resend);
                    setNewUser(fields.email);
                } catch (error2: any) {
                    if (error2.code === "InvalidParameterException") {
                        toast.error("User already exists.")
                    }
                }
            };
            // onError(e);
        }

        setIsLoading(false);
    }

    async function handleConfirmationSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        try {
            await Auth.confirmSignUp(fields.email, fields.confirmationCode);
            await Auth.signIn(fields.email, fields.password);
            userHasAuthenticated(true);
            nav("/");
        } catch (error: any) {
            toast.error("Confirmation error.");
        }
        setIsLoading(false);
    }

    function renderConfirmationForm() {
        return (
            <Form onSubmit={handleConfirmationSubmit}>
                <Stack gap={1}>
                    <Form.Group controlId="confirmationCode">
                        <Form.Label>Confirmation Code</Form.Label>
                        <Form.Control
                            size="lg"
                            autoFocus
                            type="tel"
                            onChange={handleFieldChange}
                            value={fields.confirmationCode}
                        />
                        <Form.Text muted>Please check your email for the code.</Form.Text>
                    </Form.Group>
                    <LoaderButton
                        size="lg"
                        type="submit"
                        variant="dark"
                        isLoading={isLoading}
                        disabled={!validateConfirmationForm()}
                    >
                        {!isLoading && "Verify"}
                    </LoaderButton>
                </Stack>
            </Form>
        );
    }

    function renderForm() {
        return (
            <>
                <h1>Welcome.</h1>
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
                        <LoaderButton
                            size="lg"
                            type="submit"
                            variant="dark"
                            isLoading={isLoading}
                            disabled={!validateForm()}
                        >
                            {!isLoading && "Signup"}
                        </LoaderButton>
                    </Stack>
                </Form>
            </>
        );
    }

    return (
        <div className="Signup">
            {newUser === null ? renderForm() : renderConfirmationForm()}
        </div>
    );
}