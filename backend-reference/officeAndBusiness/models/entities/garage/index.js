// Import all models
const garage_fleet = require('./garage_fleet');
const garage_driver = require('./garage_driver');
const garage_assignment = require('./garage_assignment');
const garage_document = require('./garage_document');
const garage_quote_request = require('./garage_quote_request');

// Define associations AFTER all models are loaded
garage_fleet.hasMany(garage_assignment, { foreignKey: 'vehicleId', as: 'assignments' });
garage_assignment.belongsTo(garage_driver, { foreignKey: 'driverId', as: 'driver' });
garage_assignment.belongsTo(garage_fleet, { foreignKey: 'vehicleId', as: 'vehicle' });

garage_driver.hasMany(garage_assignment, { foreignKey: 'driverId', as: 'assignments' });
garage_assignment.belongsTo(garage_fleet, { foreignKey: 'vehicleId', as: 'fleet' });

garage_document.associate({ garage_fleet, garage_driver });

garage_quote_request.belongsTo(garage_fleet, { foreignKey: 'vehicleId', as: 'fleet' });

module.exports = {
  garage_fleet,
  garage_driver,
  garage_assignment,
  garage_document,
  garage_quote_request
};
