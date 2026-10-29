const flightBooking = require('./flightBooking');
const flightModifiedBookings = require('./flightModifiedBookings');
const flightHeldBooking = require('./flightHeldBooking');

// Define associations
// flightBooking.hasMany(flightModifiedBookings, { foreignKey: 'flightBookingId', as: 'flightModifiedBookings' });
// flightModifiedBookings.belongsTo(flightBooking, { foreignKey: 'flightBookingId', as: 'flightBooking' });

flightBooking.hasMany(flightModifiedBookings);
flightModifiedBookings.belongsTo(flightBooking);

// Export models
module.exports = {
    flightBooking,
    flightModifiedBookings,
    flightHeldBooking,
};
