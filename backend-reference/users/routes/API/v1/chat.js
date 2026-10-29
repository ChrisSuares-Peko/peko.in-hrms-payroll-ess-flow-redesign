const express = require("express");
const router = express.Router();

const { createConnectionRequest, findAllRequests, updateConnectionRequestStatus, fetchAllCorporateUsers, uploadFileChat } = require("../../../controllers/corporate/connectionRequest");

router.post("/upload", uploadFileChat);
router.get('/request', findAllRequests)
router.post("/request", createConnectionRequest);
router.put("/request", updateConnectionRequestStatus);

router.get("/corporates", fetchAllCorporateUsers);

module.exports = router;
