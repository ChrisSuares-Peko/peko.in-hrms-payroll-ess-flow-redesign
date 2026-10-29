const express = require('express')
// const {
//   verifyToken
// } = require('../../../../utils/jwtToken');
const { onSearch, onSelect, onInit, onConfirm, onStatus, onTrack, onCancel, onUpdate, onIssue, onIssueStatus } = require('../../../../controllers/webhook/ondc');
const { verifyOndcWebhookAuth } = require('../../../../middlewares/ondcWebhookAuth');
const router = express.Router({mergeParams:true});

// const messageId = new Map()
// const transactionId = new Map()
// router.use((req, res, next) => {
//     if(messageId.has(req?.body?.context?.message_id)){
//         messageId.set(req?.body?.context?.message_id,messageId.get(req?.body?.context?.message_id)+1)
//     }else{
//         messageId.set(req?.body?.context?.message_id,1)
//     }
//     if(transactionId.has(req?.body?.context?.transaction_id)){
//         transactionId.set(req?.body?.context?.transaction_id,transactionId.get(req?.body?.context?.transaction_id)+1)
//     }else{
//         transactionId.set(req?.body?.context?.transaction_id,1)
//     }
//     customLog(req?.LogTraceId, "info",{
//         message: 'Request received ONDC',
//         method: req.method,
//         endpoint: req.originalUrl,
//         body: req.body?.message?.catalog?.["bpp/providers"],
//         transactionId:req?.body?.context?.transaction_id,
//         messageId:req?.body?.context?.message_id,
//         transactionNumber:transactionId.get(req?.body?.context?.transaction_id),
//         messageNumber:messageId.get(req?.body?.context?.message_id)
//     });
//     next();
// });

// ONDC callback handler. Responds with an ACK immediately (per ONDC spec) and
// processes the payload asynchronously so a slow/large catalog never blocks the
// gateway response or trips its short TTL.

router.use(verifyOndcWebhookAuth)
router.post("/on_search",onSearch)
router.post("/on_select",onSelect)
router.post("/on_init",onInit)
router.post("/on_confirm",onConfirm)
router.post("/on_status",onStatus)
router.post("/on_track",onTrack)
router.post("/on_cancel",onCancel)
router.post("/on_update",onUpdate)
router.post("/on_issue",onIssue)
router.post("/on_issue_status",onIssueStatus)
// router.post('/:action', (req, res) => {
//     const action = req.params.action;
//     customLog(req?.LogTraceId, "info", {
//         message: 'ONDC callback received',
//         action,
//         transactionId: req?.body?.context?.transaction_id,
//         messageId: req?.body?.context?.message_id,
//     });

//     if (action === 'on_search') {
//         handleOnSearch(req.body)
//             .then((result) => customLog(req?.LogTraceId, "info", {
//                 message: 'ONDC on_search processed',
//                 ...result,
//             }))
//             .catch((error) => customLog(req?.LogTraceId, "error", {
//                 message: 'ONDC on_search processing failed',
//                 transactionId: req?.body?.context?.transaction_id,
//                 error: error?.message || error,
//             }));
//     }

//     // ACK every callback; specific business logic is wired per action above.
//     return res.status(200).json({ message: { ack: { status: "ACK" } } });
// });


module.exports = router;