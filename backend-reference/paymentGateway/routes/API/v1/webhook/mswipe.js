const express = require("express");
const router = express.Router({ mergeParams: true });
const { handleReturn, handleNotification } = require("../../../../controllers/corporate/mswipeGateway");

router.get("/return", handleReturn);
router.post("/return", handleReturn);
router.post("/notify", handleNotification);

module.exports = router;
