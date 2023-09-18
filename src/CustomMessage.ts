import { CustomMessageTriggerEvent } from 'aws-lambda';

exports.handler = async (event: CustomMessageTriggerEvent) => {
    if (event.triggerSource === 'CustomMessage_SignUp') {
        try {
            event.response.emailSubject = "Verify your newsbrake account";
        } catch (error) {
            console.error('Error sending email:', error);
            throw new Error("Email sending failed");
        }
    }

    return event;
};