/**
 * Created by Bhatt Aasif.
 */
const axios = require('axios')
const { customLog } = require('./loggerHelper');

async function sendSMS(phoneNo, message) {
  if (process.env.NODE_ENV !== 'production') return;
  try {
    let data = JSON.stringify({
      "destination": phoneNo,
      "source": process.env.smsSENDER_ID,
      "text": message,
      "dataCoding": 0
    });
    let config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: process.env.smsAPI_URL,
      headers: {
        'Content-Type': 'application/json',
        'username': process.env.smsUSERNAME,
        'password': process.env.smsPASSWORD,
      },
      data: data
    };

    const response = await axios.request(config);
    customLog(null, 'info', { message: 'SMS sent', response: JSON.stringify(response.data) });
    return response.data
  } catch (error) {
    customLog(null, 'error', { message: 'SMS send failed', phoneNo, error: error.message }, 'SMS');
    return null;
  }
}


module.exports.sendSMS = sendSMS