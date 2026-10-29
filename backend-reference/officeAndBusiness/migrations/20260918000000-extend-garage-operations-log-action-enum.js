'use strict';

// Ticket 30976: the Operations Log ENUM was missing REASSIGN_DRIVER (writes were silently rejected)
// and had no values for FASTag, service-date, document and quote actions. Existing values are kept.
//
// Guarded: db:migrate runs before the app boots, and this table is created by sequelize.sync() rather
// than a migration. If the table (or column) is not there yet, skip — sync will create it from the
// model with the full ENUM. Idempotent: skipped when the column already carries the new values.
const TABLE = 'garage_operations_logs';
const COLUMN = 'actionType';

const PREVIOUS_ACTIONS = [
  'RC_LOOKUP',
  'DL_LOOKUP',
  'ADD_VEHICLE',
  'ADD_DRIVER',
  'ASSIGN_DRIVER',
  'UNASSIGN_DRIVER',
  'UPLOAD_DOCUMENT',
  'DELETE_VEHICLE',
  'DELETE_DRIVER',
  'FASTAG_RECHARGE',
];

const NEW_ACTIONS = [
  'REASSIGN_DRIVER',
  'UPDATE_FASTAG',
  'UPDATE_SERVICE_DATES',
  'UPDATE_DOCUMENT',
  'DELETE_DOCUMENT',
  'REQUEST_QUOTE',
];

const describeColumn = async (queryInterface) => {
  try {
    const table = await queryInterface.describeTable(TABLE);
    return table[COLUMN] || null;
  } catch (err) {
    return null; // table does not exist yet
  }
};

const columnHasAll = (column, values) => {
  const type = String(column?.type || '');
  return values.every((v) => type.includes(`'${v}'`));
};

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const column = await describeColumn(queryInterface);
    if (!column) return;
    if (columnHasAll(column, NEW_ACTIONS)) return;

    await queryInterface.changeColumn(TABLE, COLUMN, {
      type: Sequelize.ENUM(...PREVIOUS_ACTIONS, ...NEW_ACTIONS),
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    const column = await describeColumn(queryInterface);
    if (!column) return;
    if (!columnHasAll(column, NEW_ACTIONS)) return;

    await queryInterface.changeColumn(TABLE, COLUMN, {
      type: Sequelize.ENUM(...PREVIOUS_ACTIONS),
      allowNull: false,
    });
  },
};
