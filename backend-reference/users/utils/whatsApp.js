const axios = require('axios')
const { customLog } = require('./loggerHelper');

const AISENSY_BASE_URL = 'https://backend.api-wa.co/campaign/peko/api/v2';
const OTP_CAMPAIGN_NAME = process.env.WHATSAPP_OTP_CAMPAIGN_NAME || 'app_verification_otp';

async function sendWhatsAppOtp(mobileNo, otp, userName) {
  if (process.env.NODE_ENV !== 'production') return;
  try {
    // AiSensy needs the destination with country code
    const destination = String(mobileNo).length === 10 ? `+91${mobileNo}` : `+${String(mobileNo).replace('+', '')}`;
    const payload = {
      apiKey: process.env.AISENSY_API_KEY,
      campaignName: OTP_CAMPAIGN_NAME,
      destination,
      userName: userName || 'Peko',
      source: 'API_Trigger',
      templateParams: [otp],
      buttons: [
        {
          type: 'button',
          sub_type: 'url',
          index: '0',
          parameters: [{ type: 'text', text: otp }],
        },
      ],
    };
    const response = await axios.post(AISENSY_BASE_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    customLog(null, 'info', { message: 'OTP sent via WhatsApp', destination }, 'VENDOR');
    return response.data;
  } catch (error) {
    customLog(null, 'error', {
      message: 'WhatsApp OTP send failed',
      mobileNo,
      errorMessage: error.message,
      httpStatus: error.response?.status,
      responseData: error.response?.data,
    }, 'VENDOR');
    return null;
  }
}

module.exports = { sendWhatsAppOtp };
