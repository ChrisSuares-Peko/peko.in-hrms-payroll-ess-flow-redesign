"use strict";

module.exports = {
  async up(queryInterface) {
    await queryInterface.renameColumn(
      "esimPlans",
      "wholesalePrice",
      "vendorWholesalePriceUSD"
    );
  },

  async down(queryInterface) {
    await queryInterface.renameColumn(
      "esimPlans",
      "vendorWholesalePriceUSD",
      "wholesalePrice"
    );
  }
};