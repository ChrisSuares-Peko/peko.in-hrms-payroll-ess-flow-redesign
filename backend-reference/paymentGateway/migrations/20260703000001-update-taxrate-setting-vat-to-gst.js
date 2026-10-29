"use strict";

module.exports = {
    async up(queryInterface) {
        await queryInterface.bulkUpdate(
            "settings",
            { details: JSON.stringify({ gst: 18, type: "PERCENTAGE" }) },
            { name: "taxRate" }
        );
    },

    async down(queryInterface) {
        await queryInterface.bulkUpdate(
            "settings",
            { details: JSON.stringify({ vat: 5, type: "PERCENTAGE" }) },
            { name: "taxRate" }
        );
    },
};
