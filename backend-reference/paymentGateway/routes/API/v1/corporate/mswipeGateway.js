const express = require("express");
const router = express.Router({ mergeParams: true });
const { createOrder } = require("../../../../controllers/corporate/mswipeGateway");
const { handlePGCallback } = require("../../../../controllers/corporate/cashFreeGateway");
const validateAmount = require("../../../../middlewares/validateAmount");

router.post("/create-order", validateAmount, createOrder);
router.post("/complete", handlePGCallback);

module.exports = router;
