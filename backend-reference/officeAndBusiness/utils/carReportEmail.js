// Report-ready notification, fired by whichever path flips an order READY first (page
// open, webhook, or the scheduler sweep) — callers only invoke it when their
// conditional UPDATE actually changed the row, so exactly one email goes out.
const credential = require('../models/entities/credential');
const { fetchPartnerDetails } = require('../models/use-cases/systemUser');
const { partnerLogos } = require('./partnerLogos');
const emailer = require('./emailer');
const { generateReportReadyEmail } = require('./emailTemplates/carReport');
const { customLog } = require('./loggerHelper');

// Never throws — a failed email must not break a payment, webhook or page render.
exports.sendReportReadyEmail = async (row, logTraceId = null) => {
    try {
        const cred = await credential.findOne({
            where: { id: row.credentialId },
            attributes: ['email', 'username', 'name', 'registeredBy'],
            raw: true,
        });
        const to = cred?.email || cred?.username;
        if (!to) return;

        // Partner-branded like every payment email: the reseller's identity when the
        // corporate was registered by one, Peko's own otherwise.
        const partnerData = cred.registeredBy
            ? await fetchPartnerDetails(cred.registeredBy)
            : await partnerLogos();

        const body = generateReportReadyEmail(
            cred.name || 'Customer',
            partnerData,
            row.reportName,
            row.vehicleNumber || row.vehicleModel || '',
            row.corporateTxnId
        );
        emailer.email(to, `Your ${row.reportName} is ready`, body, () => {});
    } catch (error) {
        customLog(
            logTraceId,
            'error',
            {
                message: 'Report-ready email failed',
                corporateTxnId: row.corporateTxnId,
                error: error.message,
            },
            'CAR_REPORT'
        );
    }
};
