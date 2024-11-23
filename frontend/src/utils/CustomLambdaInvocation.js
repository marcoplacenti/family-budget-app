import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

const awsAccessKeyId = process.env.REACT_APP_AWS_ACCESS_KEY_ID;
const awsSecretAccessKey = process.env.REACT_APP_AWS_SECRET_ACCESS_KEY;

class CustomLambdaInvocation {
    constructor(){
        this.client = new LambdaClient({
            region: 'eu-central-1', // e.g., 'us-east-1'
            credentials: {
            accessKeyId: awsAccessKeyId,
            secretAccessKey: awsSecretAccessKey,
            },
        });

        this.invoke = async (functionName, payload) => {
            try {
                const command = new InvokeCommand({
                    FunctionName: functionName,
                    Payload: JSON.stringify(payload),
                });

                const response = await this.client.send(command);

                // Decode the response payload
                const decoder = new TextDecoder('utf-8');
                const result = JSON.parse(decoder.decode(response.Payload));
                return result;
            } catch (error) {
                console.error("Error invoking Lambda:", error);
                throw error;
            }
        };
    };

    invokeLambda(functionName, payload){
        return this.invoke(functionName, payload)
    }
};

export default CustomLambdaInvocation