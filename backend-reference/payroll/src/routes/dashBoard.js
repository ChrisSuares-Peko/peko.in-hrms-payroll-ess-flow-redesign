const express = require('express');
const router = express.Router();
const { getProgressForCorporateUser, getCharts, updateDashboardStatus, getAllDashboardDetailsForCorporate, getEstimatedSalary, salarySummary } = require('../controller/dashboard');
const { updateProgress } = require('../middleware/updateProgress');

// Get all dashboard details for a specific corporateUser
router.get('/', getAllDashboardDetailsForCorporate)

//Get charts
router.get('/chart', getCharts)

//progress percentage in landing page
router.get("/progress", getProgressForCorporateUser);
router.get("/estimatedSalary", getEstimatedSalary);
router.post("/dashboardStatus", updateProgress, updateDashboardStatus);
router.get("/salary-summary", salarySummary);

module.exports = router;
