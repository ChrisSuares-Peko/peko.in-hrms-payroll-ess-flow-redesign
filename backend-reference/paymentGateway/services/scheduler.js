const schedule = require('node-schedule');


exports.scheduleFunction = (func, date) => {
    schedule.scheduleJob(date, () => {
        func();
    });
}