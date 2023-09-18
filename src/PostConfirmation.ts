import { Lambda } from 'aws-sdk';
import { PostConfirmationTriggerEvent } from 'aws-lambda';

const UserInfernalInfo = process.env.USERINTERNALINFO || '';
const UserPreferences = process.env.USERPREFERENCES || '';
const lambda = new Lambda();

exports.handler = async (event: PostConfirmationTriggerEvent) => {
    if (event.triggerSource === "PostConfirmation_ConfirmSignUp") {
        try {
            await lambda.invoke({
                FunctionName: UserInfernalInfo,
                Payload: JSON.stringify(event)
            }).promise();

            await lambda.invoke({
                FunctionName: UserPreferences,
                Payload: JSON.stringify(event)
            }).promise();
        } catch (error) {
            console.log(error);
        }
    }

    return event;

};