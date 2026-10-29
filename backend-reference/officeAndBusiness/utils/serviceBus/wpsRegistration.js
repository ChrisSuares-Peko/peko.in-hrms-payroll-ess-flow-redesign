const { ServiceBusClient } = require("@azure/service-bus");
const { customLog } = require("../loggerHelper");
const { uploadFileToS3 } = require("../s3");
const { NODE_ENV } = process.env;
const queueName = "wps-esign-update";

exports.sendWPSRegistration = async (payload) => {
    let sender;
    try {
        if (!process.env.CONTAINER_APP_HOSTNAME) {
            throw new Error('Service bus not available locally')
        }

        const connectionString = process.env.AZURE_SERVICE_BUS_CONNECTION_STRING;
        const sbClient = new ServiceBusClient(connectionString, {
            retryOptions: {
                maxRetries: 3
            }
        });

        sender = sbClient.createSender(queueName);
        const { signer_info, file_content } = payload.body || {};
        if (Array.isArray(signer_info)) { // Fully completed state, else partial state - skip sending to queue
            // before sending to que store fine content to peko storage - avoid large payloads in service bus
            if (file_content) {
                const base64String = file_content.replace(/^data:application\/pdf;base64,/, '');
                const filePath = `${NODE_ENV ? NODE_ENV : "staging"}/unknown-role/unknown-user/eSignDocs`
                let updatedUrl = await uploadFileToS3(base64String, filePath, 'pdf'); //need to update with new doc 
                payload.body.file_content = updatedUrl
          
                customLog(null, "info", { payload: payload.body });
                await sender.sendMessages({
                    body: JSON.stringify(payload.body),
                    messageId: new Date().toISOString()
                });
            }
        }

        return { status: true, message: "Success" };

    } catch (error) {
        customLog(null, "error", { message: `Failed to send messages to queue: ${queueName}`, error });
        return { status: false, message: "Something went wrong while updating WPS eSign status" };
    } finally {
        if (sender) await sender.close();
    }
}