const { findOneOrder } = require('../models/use-cases/order');
const { findServiceOperatorByAccessKey } = require('./checkAndFetchServiceDetails');
const { publishJournalEvent } = require('./bull/queue/accountingEventsQueue');
const { customLog } = require('./loggerHelper');
const operatorsData = require('./operatorsData.json');

// A car report refund that comes after the order was created is journalled from the journal data stored on the order.
exports.publishStoredRefundJournal = async ({ corporateTxnId, credentialId, registeredBy, logTraceId }) => {
    try {
        const order = await findOneOrder({ corporateTxnId: String(corporateTxnId) });
        if (!order?.journalData) return;
        const service = await findServiceOperatorByAccessKey(operatorsData.carReport.accessKey);
        publishJournalEvent(
            {
                transactionRef: corporateTxnId,
                type: 'refund',
                contextSnapshot: {
                    credentialId,
                    vendor: service?.vendor || null,
                    registeredBy: registeredBy || null,
                },
                reportData: { journalData: order.journalData },
            },
            logTraceId
        );
    } catch (error) {
        customLog(logTraceId, 'error', { message: 'Car report refund journal event failed', corporateTxnId, error: error?.message });
    }
};
