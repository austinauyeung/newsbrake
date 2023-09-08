import React, { useState } from "react";
import Form from "react-bootstrap/Form";
import Stack from "react-bootstrap/Stack";
import { Auth } from "aws-amplify";
import { useAppContext } from "../lib/contextLib";
import { useNavigate } from "react-router-dom";
import LoaderButton from "../components/LoaderButton";
import { onError } from "../lib/errorLib";
import { InputGroup } from "react-bootstrap";
import { useFormFields } from "../lib/hooksLib";
import { toast } from "react-toastify";
import "./Login.css";

export default function Login() {
    const { userHasAuthenticated } = useAppContext();

    const [fields, handleFieldChange] = useFormFields({
        email: "",
        password: "",
    })

    const [isLoading, setIsLoading] = useState(false);
    const nav = useNavigate();
    const suffix = "@gmail.com";

    function validateForm() {
        return fields.email.length > 0 && fields.password.length > 0;
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);

        try {
            await Auth.signIn(`${fields.email}${suffix}`, fields.password);
            userHasAuthenticated(true);
            nav("/feeds");
            toast("Login successful.", { toastId: "login" })
        } catch (error) {
            onError(error);
        }
        setIsLoading(false);
    }

    return (
        <div className="Login">
            <h1>Welcome back.</h1>
            <Form onSubmit={handleSubmit} noValidate>
                <Stack gap={1}>
                    {/* <Form.Label htmlFor="email">Kindle e-mail</Form.Label> */}
                    <InputGroup>
                        <Form.Control
                            id="email"
                            autoComplete="on"
                            autoFocus
                            size="lg"
                            type="email"
                            value={fields.email}
                            onChange={handleFieldChange}
                            placeholder="Kindle e-mail"
                        />
                        <InputGroup.Text id="domain">
                            {suffix}
                        </InputGroup.Text>
                    </InputGroup>

                    {/* <Form.Group controlId="email">
                        <Form.Label>Kindle e-mail</Form.Label>
                        <Form.Control
                            autoFocus
                            size="lg"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="E-mail"
                        />
                    </Form.Group> */}

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
                    <LoaderButton size="lg" type="submit" isLoading={isLoading} disabled={!validateForm()}>
                        {!isLoading && "Login"}
                    </LoaderButton>
                </Stack>
            </Form>
        </div>
    )
}