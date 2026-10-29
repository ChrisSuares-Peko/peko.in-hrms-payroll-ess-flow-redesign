const { PubSub } = require("@google-cloud/pubsub");
const { customLog } = require("./loggerHelper");
const pubsub = new PubSub({ projectId: process.env.GOOGLE_PROJECT_ID });

const topicName = process.env.TOPIC_NAME; //Need to create one inside the project

async function publishMessagesInBatch(messages) {
  try {
    if (!process.env.CLOUD_RUN_TIMEOUT_SECONDS) {
      throw new Error("Service bus not available locally");
    }
    const publishPromises = messages.map(async (data, index) => {
      try {
        const parsedData = typeof data === "string" ? JSON.parse(data) : data;

        if (!parsedData.accessKey || typeof parsedData.accessKey !== "string") {
          throw new Error(`Invalid or missing accessKey: ${parsedData.accessKey}`);
        }

        const dataBuffer = Buffer.from(JSON.stringify(parsedData));
        const messageId = await pubsub.topic(topicName).publishMessage({
          data: dataBuffer,
          attributes: { accessKey: parsedData.accessKey },
        });
        return messageId;
      } catch (err) {
        console.error(`[PUBSUB DEBUG] FAILED to publish message ${index + 1}:`, err.message);
        throw err;
      }
    });

    // Wait for all messages to be published
    const messageIds = await Promise.all(publishPromises);
    customLog(null, "info", {
      message: `Published ${messageIds.length} messages successfully to topic: ${topicName}`,
      messageIds,
      topic: topicName,
    });
  } catch (error) {
    customLog(null, "error", {
      message: `Error publishing messages: ${error.message}`,
      error: error,
    });
    throw new Error(`Failed to publish messages: ${error.message}`);
  }
}

module.exports = { publishMessagesInBatch };
