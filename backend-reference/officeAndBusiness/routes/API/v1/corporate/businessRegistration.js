const express = require('express');

const router = express.Router({ mergeParams: true });
const {
    checkBusinessName,
    getBusinessActivities,
    locationLookup,
    jurisdictionLookup,
    searchHsnCode,
    verifyPan,
    verifyDin,
    getCatalog,
    getCustomer,
    getDocumentChecklist,
    getServiceDocuments,
    createLead,
    submitFeedback,
    saveDraft,
    payForApplication,
    submitApplication,
    uploadApplicationDocument,
    syncDocuments,
    viewApplicationDocument,
    sendToVendor,
    runPaymentPhase,
    getApplicationStatus,
    getApplications,
    getApplicationDetail,
    callRm,
} = require('../../../../controllers/corporate/businessRegistration');

// Phase 1 — IndiaFilings lookup / pre-application endpoints.
router.post('/name-check', checkBusinessName);
router.get('/business-activities', getBusinessActivities);
router.post('/location', locationLookup);
router.post('/jurisdiction', jurisdictionLookup);
router.post('/hsn-code', searchHsnCode);
router.post('/verify-pan', verifyPan);
router.post('/verify-din', verifyDin);
router.get('/catalog', getCatalog);
router.get('/customer', getCustomer);
router.get('/document-checklist', getDocumentChecklist);
router.get('/service-documents', getServiceDocuments);
router.post('/lead', createLead);
router.post('/feedback', submitFeedback);

// Phase 2 — application persistence + vendor create-chain (doc v1.1).
router.post('/applications/draft', saveDraft);
router.post('/payment', payForApplication);
router.post('/applications', submitApplication);
router.get('/applications', getApplications);
router.get('/applications/:applicationId/status', getApplicationStatus);
router.post('/applications/:applicationId/call-rm', callRm);
// Same handler as above — other verticals (e.g. Government Services), which have
// no Business Registration application here to scope by, call this with just an
// engagement_id in the body instead.
router.post('/call-rm', callRm);
router.post('/applications/:applicationId/documents', uploadApplicationDocument);
router.post('/applications/:applicationId/documents/sync', syncDocuments);
router.post('/applications/:applicationId/documents/view', viewApplicationDocument);
router.post('/applications/:applicationId/send-to-vendor', sendToVendor);
router.post('/applications/:applicationId/vendor-payment-phase', runPaymentPhase);
router.get('/applications/:applicationId', getApplicationDetail);

module.exports = router;
