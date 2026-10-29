const express = require("express");
const router = express.Router();

const { createHike, findAllHikes, updateHike, generatePDF, getExcel } = require("../../../../controllers/admin/hike");
const { validateHike } = require("../../../../utils/apiValidation");
const { findAllHikesValidation } = require("../../../../utils/queryValidation");

router.post("/", validateHike, createHike);
router.get("/",findAllHikesValidation, findAllHikes);
router.put("/:id", updateHike);
router.get('/pdf', generatePDF)
router.get('/:type', getExcel)

module.exports = router;
