import React, { useState, useEffect } from "react";
import { Form, Stack } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { useAppContext } from "../lib/contextLib";
import { useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { useFormFields } from "../lib/hooksLib";
import { toast } from "react-toastify";
import { MotionDiv } from "../Motion";
import { validateForm, validPassword, renderConfirmationForm } from "../lib/auxiliary";
import "../authStyles.css";

export default function Login() {
    const { userHasAuthenticated, isAuthenticated } = useAppContext();
    const [fields, handleFieldChange, setField] = useFormFields({
        email: "",
        password: "",
        confirmPassword: "",
        confirmationCode: "",
    })

    const [loginState, setLoginState] = useState('login');
    const [isLoadingLogin, setIsLoadingLogin] = useState(false);
    const [isLoadingReset, setIsLoadingReset] = useState(false);
    const [isLoadingResetConfirm, setIsLoadingResetConfirm] = useState(false);
    const [isLoadingReconfirm, setIsLoadingReconfirm] = useState(false);
    const nav = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            nav("/");
        }
    }, [])

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoadingLogin(true);

        try {
            await Auth.signIn(fields.email, fields.password);
            userHasAuthenticated(true);
            nav("/");
        } catch (error: any) {
            console.log(error)
            switch (error.code) {
                case "UserNotConfirmedException":
                    toast.info("Your account has not yet been verified.");

                    try {
                        await Auth.resendSignUp(fields.email);
                        setLoginState('reconfirm')
                    } catch (error: any) {
                        console.log("Reconfirm error.")
                        console.log(error)
                    }

                    break;
                case "NotAuthorizedException":
                    toast.error("Invalid login credentials.");
                    break;
                case "UserNotFoundException":
                    toast.error("Invalid login credentials.");
                    break;
                default:
                    toast.error("Login error.");
                    break;
            }
        }
        setIsLoadingLogin(false);
    }

    async function handleResetSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoadingReset(true);

        setField('password', '')

        try {
            await Auth.forgotPassword(fields.email);
        } catch (error: any) {
            console.log(error)
            // toast.error(error.message);
        }
        setLoginState('resetConfirm');
        toast.info("If this e-mail is registered, a confirmation code has been sent.", { toastId: 'reset' })
        setIsLoadingReset(false);
    }

    async function handleConfirmSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoadingResetConfirm(true);

        (['email', 'password', 'confirmPassword', 'confirmationCode'] as string[]).forEach((id: string) => setField(id, ''))
        try {
            await Auth.forgotPasswordSubmit(fields.email, fields.confirmationCode, fields.password);
            setLoginState('login');

            toast.info("Your password has been reset.", { toastId: 'confirm' })
        } catch (error: any) {
            switch (error.code) {
                case "CodeMismatchException":
                    toast.error("Invalid confirmation code.")
                    break;
                default:
                    toast.error("Reset error.")
                    break;
            }
        }
        setLoginState('login');
        setIsLoadingResetConfirm(false);
    }

    function renderLogin() {
        return (
            <MotionDiv variant="fadeIn" delay={0.1} className="Login">
                <h1>Welcome back.</h1>
                <div>
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
                                isLoading={isLoadingLogin}
                                disabled={!validateForm(fields, 'login')}
                            >
                                {!isLoadingLogin && "Login"}
                            </LoaderButton>
                        </Stack>
                    </Form>
                    <h2 className="mt-5 text-center Reset" onClick={() => setLoginState('reset')}>Reset Password</h2>
                </div>
            </MotionDiv>
        )
    }

    function renderReset() {
        return (
            <div className="Login">
                <Form onSubmit={handleResetSubmit}>
                    <Stack gap={1}>
                        <Form.Group controlId="email">
                            <Form.Label>Please enter your e-mail address</Form.Label>
                            <Form.Control
                                autoFocus
                                size="lg"
                                type="email"
                                value={fields.email}
                                onChange={handleFieldChange}
                            />
                        </Form.Group>
                        <LoaderButton
                            size="lg"
                            type="submit"
                            variant="dark"
                            isLoading={isLoadingReset}
                            disabled={!validateForm(fields, 'reset')}
                        >
                            {!isLoadingReset && "Submit"}
                        </LoaderButton>
                    </Stack>
                </Form>
            </div>
        )
    }
    function renderConfirm() {
        return (
            <div className="Login">
                <Form onSubmit={handleConfirmSubmit}>
                    <Stack gap={1}>
                        <Form.Group controlId="confirmationCode">
                            {/* <Form.Label>Confirmation Code</Form.Label> */}
                            <Form.Control
                                size="lg"
                                autoFocus
                                type="tel"
                                onChange={handleFieldChange}
                                value={fields.confirmationCode}
                                placeholder="Confirmation Code"
                            />
                            {/* <Form.Text muted>Please check your email for the code.</Form.Text> */}
                        </Form.Group>
                        <Form.Group controlId="password">
                            {/* <Form.Label>Password</Form.Label> */}
                            <Form.Control
                                size="lg"
                                type="password"
                                value={fields.password}
                                onChange={handleFieldChange}
                                placeholder="New Password"
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
                            isLoading={isLoadingResetConfirm}
                            disabled={!validateForm(fields, 'resetConfirm')}
                        >
                            {!isLoadingResetConfirm && "Reset"}
                        </LoaderButton>
                    </Stack>
                </Form>
            </div>
        )
    }

    switch (loginState) {
        case 'login':
            return renderLogin();
        case 'reset':
            return renderReset();
        case 'resetConfirm':
            return renderConfirm();
        case 'reconfirm':
            return renderConfirmationForm(nav, isLoadingReconfirm, setIsLoadingReconfirm, userHasAuthenticated, fields, handleFieldChange);
        default:
            return renderLogin();
    }
}