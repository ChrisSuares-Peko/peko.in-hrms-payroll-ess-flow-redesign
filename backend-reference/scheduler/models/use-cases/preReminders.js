const asyncHandler = require("../../middlewares/async");
const Setting = require("../entities/setting");

exports.fetchReminders = asyncHandler(async (searchText, page, itemsPerPage) => {
    const setting = await Setting.findOne({
        where: { name: 'preRemaindersForSubscription' },
        attributes: ['details']
    });

    if (!setting) return { dates: [], totalCount: 0 };

    const details = Array.isArray(setting.details) ? setting.details : [];

    const filteredDetails = searchText
        ? details.filter(item =>
            item.day?.toString().includes(searchText) ||
            item.scheduledTime?.includes(searchText)
        )
        : details;

    const totalCount = filteredDetails.length;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedDetails = filteredDetails.slice(startIndex, endIndex);

    return { dates: paginatedDetails, totalCount };
});


exports.isDuplicateEntry = asyncHandler(async (currentDay, newDay) => {
    const name = "preRemaindersForSubscription"
    const data = await Setting.findOne({
        where: {
            name
        }
    })

    for(let entry of data.details) {
        if(entry === newDay && entry !== currentDay) return { message: "Reminder day already exists"}
    }

    return false
});
exports.changeReminderDay = asyncHandler(async (currentDay, newDay) => {
    const setting = await Setting.findOne({ where: { name: 'preRemaindersForSubscription' } });
    if (!setting) return null;

    const updatedDetails = setting.details.map(item => {
        if (item === currentDay) {
            return newDay ;
        }
        return item;
    });

    await setting.update({ details: updatedDetails });

    return updatedDetails;
});

exports.deletePreReminderDay = asyncHandler(async (day, scheduledTime) => {
    const setting = await Setting.findOne({
        where: { name: 'preRemaindersForSubscription' }
    });

    if (!setting) return null;

    // Filter out the reminder that matches the day and scheduledTime
    const updatedDetails = setting.details.filter(item => {
        return !(item.day === +day && item.scheduledTime === scheduledTime);
    });

    // Check if the reminder was actually deleted
    if (updatedDetails.length === setting.details.length) {
        throw new Error('Pre Reminder not found');
    }

    // Update the setting with the new details
    await setting.update({ details: updatedDetails });

    return updatedDetails;
});

