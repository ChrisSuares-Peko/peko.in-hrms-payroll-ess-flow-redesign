const express = require("express");

const router = express.Router({ mergeParams: true });
const { listSettings, createSetting, updateSetting } = require("../../../../controllers/admin/settings");
const { validateSettingWrite } = require("../../../../utils/apiValidation");

// Admin Settings Manager — generic CRUD over the shared settings table (no delete).
router.get("/", listSettings);
router.post("/", validateSettingWrite, createSetting);
router.put("/:id", validateSettingWrite, updateSetting);

module.exports = router;
