'use strict';
const express = require('express');
const router  = express.Router({ mergeParams: true });

const { getDashboard, getCharts, getActivity } =
  require('../../../../../controllers/corporate/procure/dashboardController');

router.get('/',          getDashboard);
router.get('/charts',    getCharts);
router.get('/activity',  getActivity);

module.exports = router;
