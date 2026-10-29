'use strict';

// The model no longer declares `accountNumber: { unique: true }` (removed when this model
// was aligned with the `others` microservice's bankDetails model, which never had this
// constraint) — but the live table still carries the unique index from officeAndBusiness's
// original definition. Two different customers legitimately sharing an account-number
// string (test data, or the same number format at different banks) would otherwise be
// blocked for no real reason. Guarded so it's a no-op once the index is gone.
module.exports = {
  up: async (queryInterface) => {
    const indexes = await queryInterface.showIndex('bankDetails');
    const hasUniqueIndex = indexes.some((i) => i.name === 'accountNumber');
    if (hasUniqueIndex) {
      await queryInterface.removeIndex('bankDetails', 'accountNumber');
    }
  },

  down: async (queryInterface) => {
    const indexes = await queryInterface.showIndex('bankDetails');
    const hasUniqueIndex = indexes.some((i) => i.name === 'accountNumber');
    if (!hasUniqueIndex) {
      await queryInterface.addIndex('bankDetails', ['accountNumber'], {
        name: 'accountNumber',
        unique: true,
      });
    }
  },
};
