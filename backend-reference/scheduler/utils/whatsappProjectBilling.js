const Sequelize = require('sequelize');
const axios = require('axios');
const sequelizeConfig = require('../configs/database/index');
const { customLog } = require('./loggerHelper');
const operatorsData = require('./operatorsData.json');

const PENDING_PROJECT_ID = 'PENDING';
const WHATSAPP_ACCESS_KEY = operatorsData['whatsAppForBusiness']['accessKey'];

const stopWhatsAppProjectBilling = async (projectId, traceId = null) => {
  try {
    if (!projectId || projectId === PENDING_PROJECT_ID) {
      return { status: false, skipped: 'no-project' };
    }
    if (process.env.NODE_ENV === 'staging') {
      return { status: false, skipped: 'staging' };
    }

    const [vendor] = await sequelizeConfig.query(
      `SELECT v.apiUrl, v.optional1, v.optional2
         FROM serviceOperators so
         JOIN vendors v ON so.vendorId = v.id
        WHERE so.accessKey = :accessKey
        LIMIT 1`,
      { replacements: { accessKey: WHATSAPP_ACCESS_KEY }, type: Sequelize.QueryTypes.SELECT }
    );

    if (!vendor?.apiUrl || !vendor?.optional1 || !vendor?.optional2) {
      customLog(traceId, 'error', { message: 'stopWhatsAppProjectBilling: WhatsApp vendor creds not found — skipping', projectId });
      return { status: false, skipped: 'no-vendor' };
    }

    const { apiUrl: URL, optional1: API_Key, optional2: PartnerId } = vendor;
    await axios({
      method: 'patch',
      url: `${URL}/partner/${PartnerId}/stop-project-billing/${projectId}`,
      headers: { 'Content-Type': 'application/json', 'X-AiSensy-Partner-API-Key': `${API_Key}` },
      timeout: 30000,
    });

    customLog(traceId, 'info', { message: 'stopWhatsAppProjectBilling: AiSensy billing stopped', projectId }, 'VENDOR');
    return { status: true };
  } catch (error) {
    customLog(traceId, 'error', {
      message: 'stopWhatsAppProjectBilling: failed (non-fatal)',
      projectId,
      error: error?.response?.data ?? error?.message ?? error,
    }, 'VENDOR');
    return { status: false, error: error?.message };
  }
};

module.exports = { stopWhatsAppProjectBilling };
