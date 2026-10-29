const schedule = require("node-schedule");
const Setting = require("../../models/entities/setting");
const { fetchReminders, deletePreReminderDay , } = require("../../models/use-cases/preReminders");
const { subscriptionPreReminder } = require("../../services/subscriptionPreRiminder");
const asyncHandler = require("../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper");

const scheduledJobs = {};

const scheduleJobForReminder = (reminder) => {
    const { day, scheduledTime } = reminder;

    const jobKey = `${day}-${scheduledTime}`;

    const [hour, minute] = scheduledTime.split(':').map(Number);

    const job = schedule.scheduleJob({ hour, minute }, async () => {
        try {
            await subscriptionPreReminder(day);
        } catch (error) {
            console.error('Error running scheduled job:', error);
        }
    });

    scheduledJobs[jobKey] = job;
};

exports.restoreScheduledJobs = async () => {
    try {
        const setting = await Setting.findOne({
            where: { name: 'preRemaindersForSubscription' },
            attributes: ['details'],
        });

        if (!setting || !setting.details || setting.details.length === 0) {
            return;
        }

        setting.details.forEach(reminder => {
            scheduleJobForReminder(reminder);
        });
    } catch (error) {
        console.error('Error restoring scheduled jobs:', error);
    }
};


exports.createOrUpdateReminderDates = asyncHandler(async (req, res) => {
    const { name, day, scheduledTime } = req.body;
    const existingSetting = await Setting.findOne({ where: { name } });


    if (typeof day !== 'number' || !scheduledTime) {
        return res.status(400).json({
            status: false,
            message: 'Day should be a number and scheduledTime should be provided',
            data: {},
            responseCode: '001',
        });
    }

    const newReminder = { day, scheduledTime };


    if (existingSetting) {

        const existingReminder = existingSetting.details.find(
            item => item.day === newReminder.day && item.scheduledTime === newReminder.scheduledTime
        );

        if (existingReminder) {
            return res.status(400).json({
                status: false,
                message: 'This reminder already exists',
                data: {},
                responseCode: '001',
            });
        }

        const updatedDetails = [...existingSetting.details, newReminder];
        existingSetting.details = updatedDetails;
        try {
           await existingSetting.save();
          } catch (error) {
            return res.status(500).json({
              status: false,
              message: 'An error occurred while saving the setting',
              data: {},
              responseCode: '002',
            });
          }

        scheduleJobForReminder(newReminder);

        return res.status(201).json({
            status: true,
            message: 'Pre reminder updated and scheduler set successfully',
            data: existingSetting,
            responseCode: '000',
        });
    }

    const newSetting = await Setting.create({
        name,
        details: [newReminder],
    });


    scheduleJobForReminder(newReminder);

    return res.status(201).json({
        status: true,
        message: 'Pre reminder added and scheduler set successfully',
        data: newSetting,
        responseCode: '000',
    });
});


exports.getPreReminders = asyncHandler(async (req, res) => {
    try {
        const { searchText = '', page = 1, itemsPerPage = 10 } = req.query;
        const { dates, totalCount } = await fetchReminders(searchText, page, itemsPerPage);

        return res.status(200).json({
            status: true,
            message: 'Pre reminder dates fetched successfully',
            data: {
                days: dates,
                totalCount,
                currentPage: page,
                itemsPerPage
            },
            responseCode: '000'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch Pre reminder dates',
            data: {},
            responseCode: '001'
        });
    }
});

exports.removePreReminderDay = asyncHandler(async (req, res) => {
    try {
        const { day, scheduledTime } = req.query;
        const updatedDetails = await deletePreReminderDay(day, scheduledTime);

        if (!updatedDetails) {
            return res.status(404).json({
                status: false,
                message: 'Pre reminder not found',
                data: {},
                responseCode: '001'
            });
        }

        const jobKey = `${day}-${scheduledTime}`;

        if (scheduledJobs[jobKey]) {
            scheduledJobs[jobKey].cancel(); 
            delete scheduledJobs[jobKey];  
            customLog(req?.LogTraceId, "info", { day, scheduledTime, message: "Scheduler removed" });
        }

        return res.status(200).json({
            status: true,
            message: 'Pre reminder deleted and scheduler removed successfully',
            data: updatedDetails,
            responseCode: '000'
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Failed to delete Pre reminder',
            data: {},
            responseCode: '001'
        });
    }
});




