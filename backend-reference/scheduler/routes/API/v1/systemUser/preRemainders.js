const express = require('express');
const { createOrUpdateReminderDates, getPreReminders, removePreReminderDay } = require('../../../../controllers/admin/preRemainders');
const { getPreRemindersValidation } = require('../../../../utils/queryValidation');
const router = express.Router();

router.post('/', createOrUpdateReminderDates);

router.get('/', getPreRemindersValidation, getPreReminders);

// router.put('/', updatePreReminders);

router.delete('/', removePreReminderDay);

module.exports = router;
