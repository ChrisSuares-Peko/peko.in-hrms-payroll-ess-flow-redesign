"use strict";

const DEPOSITS = "vendorDeposits";
const CREDIT_NOTES = "vendorCreditNotes";

const REFERENCE_KEY = "activeReferenceKey";
const REFERENCE_INDEX = "vendorDeposits_activeReference_unique";
const OPENING_KEY = "activeOpeningKey";
const OPENING_INDEX = "vendorDeposits_activeOpening_unique";
const CREDIT_NOTE_KEY = "activeCreditNoteKey";
const CREDIT_NOTE_INDEX = "vendorCreditNotes_activeNumber_unique";

const APPLIED_COLUMNS = ["appliedAt", "appliedById", "appliedByName"];

const dropGenerated = async (queryInterface, table, column, index) => {
    const described = await queryInterface.describeTable(table);
    if (!described[column]) return;

    const indexes = await queryInterface.showIndex(table);
    if (indexes.some(row => row.name === index)) {
        await queryInterface.removeIndex(table, index);
    }
    await queryInterface.removeColumn(table, column);
};

const addGenerated = async (queryInterface, table, column, index, expression, type) => {
    const described = await queryInterface.describeTable(table);
    if (described[column]) return;

    await queryInterface.sequelize.query(
        `ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${type}
         GENERATED ALWAYS AS (${expression}) STORED`
    );
    await queryInterface.addIndex(table, [column], { unique: true, name: index });
};

module.exports = {
    async up(queryInterface, Sequelize) {
        const hasDeposits = await queryInterface.tableExists(DEPOSITS);
        const hasCreditNotes = await queryInterface.tableExists(CREDIT_NOTES);

        if (hasDeposits) {
            const described = await queryInterface.describeTable(DEPOSITS);
            if (!described.entryType) {
                await queryInterface.addColumn(DEPOSITS, "entryType", {
                    type: Sequelize.ENUM("DEPOSIT", "OPENING", "REVERSAL"),
                    allowNull: false,
                    defaultValue: "DEPOSIT",
                });
            }
            if (!described.reversesId) {
                await queryInterface.addColumn(DEPOSITS, "reversesId", {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                });
                await queryInterface.addIndex(DEPOSITS, ["reversesId"], {
                    name: "vendorDeposits_reversesId",
                });
            }

            // A reversal carries its original's reference and an opening row carries none,
            // so only a live DEPOSIT may hold the unique reference.
            await dropGenerated(queryInterface, DEPOSITS, REFERENCE_KEY, REFERENCE_INDEX);
            await addGenerated(
                queryInterface,
                DEPOSITS,
                REFERENCE_KEY,
                REFERENCE_INDEX,
                `IF(entryType = 'DEPOSIT' AND status = 'ACTIVE' AND vendorId IS NOT NULL AND reference IS NOT NULL,
                    CONCAT(vendorId, ':', reference),
                    NULL)`,
                "VARCHAR(120)"
            );

            await addGenerated(
                queryInterface,
                DEPOSITS,
                OPENING_KEY,
                OPENING_INDEX,
                `IF(entryType = 'OPENING' AND status = 'ACTIVE', vendorId, NULL)`,
                "BIGINT"
            );

            await queryInterface.changeColumn(DEPOSITS, "reference", {
                type: Sequelize.STRING(40),
                allowNull: true,
            });
        }

        if (hasCreditNotes) {
            const described = await queryInterface.describeTable(CREDIT_NOTES);
            if (!described.entryType) {
                await queryInterface.addColumn(CREDIT_NOTES, "entryType", {
                    type: Sequelize.ENUM("CREDIT_NOTE", "REVERSAL"),
                    allowNull: false,
                    defaultValue: "CREDIT_NOTE",
                });
            }
            if (!described.reversesId) {
                await queryInterface.addColumn(CREDIT_NOTES, "reversesId", {
                    type: Sequelize.BIGINT,
                    allowNull: true,
                });
                await queryInterface.addIndex(CREDIT_NOTES, ["reversesId"], {
                    name: "vendorCreditNotes_reversesId",
                });
            }

            // Applying a credit note is gone: an applied note simply counts again.
            await queryInterface.sequelize.query(
                `UPDATE \`${CREDIT_NOTES}\` SET status = 'OPEN' WHERE status = 'APPLIED'`
            );
            await queryInterface.changeColumn(CREDIT_NOTES, "status", {
                type: Sequelize.ENUM("OPEN", "VOIDED"),
                allowNull: false,
                defaultValue: "OPEN",
            });
            for (const column of APPLIED_COLUMNS) {
                if (described[column]) await queryInterface.removeColumn(CREDIT_NOTES, column);
            }

            await dropGenerated(queryInterface, CREDIT_NOTES, CREDIT_NOTE_KEY, CREDIT_NOTE_INDEX);
            await addGenerated(
                queryInterface,
                CREDIT_NOTES,
                CREDIT_NOTE_KEY,
                CREDIT_NOTE_INDEX,
                `IF(entryType = 'CREDIT_NOTE' AND status = 'OPEN' AND vendorId IS NOT NULL AND creditNoteNumber IS NOT NULL,
                    CONCAT(vendorId, ':', creditNoteNumber),
                    NULL)`,
                "VARCHAR(120)"
            );
        }
    },

    async down(queryInterface, Sequelize) {
        const hasDeposits = await queryInterface.tableExists(DEPOSITS);
        const hasCreditNotes = await queryInterface.tableExists(CREDIT_NOTES);

        if (hasDeposits) {
            await dropGenerated(queryInterface, DEPOSITS, OPENING_KEY, OPENING_INDEX);
            const described = await queryInterface.describeTable(DEPOSITS);
            if (described.reversesId) await queryInterface.removeColumn(DEPOSITS, "reversesId");
            if (described.entryType) await queryInterface.removeColumn(DEPOSITS, "entryType");
        }

        if (hasCreditNotes) {
            const described = await queryInterface.describeTable(CREDIT_NOTES);
            if (described.reversesId) await queryInterface.removeColumn(CREDIT_NOTES, "reversesId");
            if (described.entryType) await queryInterface.removeColumn(CREDIT_NOTES, "entryType");
            await queryInterface.changeColumn(CREDIT_NOTES, "status", {
                type: Sequelize.ENUM("OPEN", "APPLIED", "VOIDED"),
                allowNull: false,
                defaultValue: "OPEN",
            });
        }
    },
};
