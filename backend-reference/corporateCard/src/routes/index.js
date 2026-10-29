
const router = (module.exports = require("express")());

router.use("/webhook/:webhookUser/corporate-cards", require("./webhooks"))