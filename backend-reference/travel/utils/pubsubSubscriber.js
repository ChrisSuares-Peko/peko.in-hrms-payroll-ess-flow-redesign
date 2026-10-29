const { PubSub } = require('@google-cloud/pubsub');
const { customLog } = require('./loggerHelper');
const { processHotelBooking } = require('../controllers/corporate/hotel');
const pubsub = new PubSub({ projectId: process.env.GOOGLE_PROJECT_ID });

const subscriptionName = process.env.PUBSUB_SUBSCRIPTION_NAME; //Update the subscription created inside the topic here

// Process the message from the subscription
async function processMessage(messageReceived) {
  try {
    customLog(null, "info", { message: { messageReceived: messageReceived?.data.toString() } })

    const messageString = messageReceived.data.toString();
    let messageBody;
    const TWO_DAYS_IN_MS = 2 * 24 * 60 * 60 * 1000;

    // Remove the outer quotes and parse the actual JSON
    messageBody = JSON.parse(messageString); // Second parse to get the object
    const { accessKey, delay = 0 } = messageBody; 
    if (!accessKey) {
      throw new Error('Message is missing accessKey');
    }
    let res;


    if (accessKey === "hotels_api") { //here i want delayed execution

      //skipping messages older than 2 days
      if (messageReceived?.publishTime) {
        const { seconds, nanos } = messageReceived.publishTime;
        const publishTime = new Date(seconds * 1000 + nanos / 1e6);
        const now = new Date();

        if (now - publishTime > TWO_DAYS_IN_MS) {
          customLog(null, "info", {
            message: "Skipping and acknowledging stale message (older than 2 days)",
            publishTime: publishTime.toISOString(),
          });
          messageReceived.ack(); // Remove from queue
          return;
        }
      }

      if (delay && typeof delay === "number" && delay > 0) {
        customLog(null, "info", { message: "log for getting message details", data: messageReceived });
        customLog(null, "info", { message: "log for getting publishTime", data: messageReceived?.publishTime });
        customLog(null, "info", { message: `Delaying execution for ${delay} seconds for hotels status check api...` });
        await new Promise((resolve) => setTimeout(resolve, delay * 1000)); // Delay in milliseconds
      }
      try {
        customLog(null, "info", { message: "processing message travel broker" });
        res = await processHotelBooking(messageBody);
      } catch (error) {
        customLog(null, "error", { message: "processing message travel broker error", error });
      }
    } else {
      return
    }

    if (!res) throw new Error('Failed to process message');

    // Acknowledge the message after successful processing
    messageReceived.ack();
  } catch (error) {
    customLog(null, "error", { message: "Failed to process message travel:", error: error })
    // Optionally, message will not be acknowledged if there's an error (to allow retry)
  }
}

const myErrorHandler = (error) => {
  customLog(null, "error", { message: "Error occurred in travel: ", error })
};

// Set up the subscriber for the subscription
async function subscribeToMessages() {
  const subscription = pubsub.subscription(subscriptionName);

  subscription.on('message', (message) => {
    processMessage(message);
  });

  subscription.on('error', myErrorHandler);
  customLog(null, "info", { message: `Subscribed to the "${subscriptionName}" subscription successfully.` })
}
module.exports = { subscribeToMessages };

