'use strict';

const TABLE = 'flightHeldBookings';

// Case-insensitive: MySQL lowercases table names when lower_case_table_names=1 (Windows default).
async function tableExists(queryInterface) {
    const tables = await queryInterface.showAllTables();
    return tables.some((name) => String(name).toLowerCase() === TABLE.toLowerCase());
}

async function hasIndex(queryInterface, indexName) {
    const indexes = await queryInterface.showIndex(TABLE);
    return indexes.some((index) => index.name === indexName);
}

// Indexes are checked independently of the table so a part-way run is repaired on re-run.
const INDEXES = [
    { name: 'flightHeldBookings_match_idx', fields: ['credentialId', 'matchHash', 'status'] },
    { name: 'flightHeldBookings_release_idx', fields: ['status', 'releaseAt'] },
    { name: 'flightHeldBookings_bookingId_idx', fields: ['BookingId'] },
    { name: 'flightHeldBookings_route_idx', fields: ['credentialId', 'routeHash', 'status'] },
];

module.exports = {
    async up(queryInterface, Sequelize) {
        if (!(await tableExists(queryInterface))) {
            await queryInterface.createTable(TABLE, {
                id: {
                    type: Sequelize.INTEGER,
                    autoIncrement: true,
                    primaryKey: true,
                },
                credentialId: {
                    type: Sequelize.INTEGER,
                    allowNull: false,
                },
                subCorporateUserId: {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                },
                // sha256 hex. Nullable: an unfingerprintable hold is still recorded so it
                // gets released, it just cannot be resumed.
                matchHash: {
                    type: Sequelize.STRING(64),
                    allowNull: true,
                },
                // matchHash without fare class, so a superseded hold can be found and released.
                routeHash: {
                    type: Sequelize.STRING(64),
                    allowNull: true,
                },
                // Indexed columns stay narrow: older InnoDB row formats cap keys at 767 bytes.
                status: {
                    type: Sequelize.STRING(32), // HELD | CONSUMED | RELEASED | RELEASE_FAILED
                    allowNull: false,
                    defaultValue: 'HELD',
                },
                legType: {
                    type: Sequelize.STRING(16), // OUTBOUND | INBOUND
                    allowNull: false,
                    defaultValue: 'OUTBOUND',
                },
                // Ties the two legs of a domestic round trip together.
                groupKey: {
                    type: Sequelize.STRING(64),
                    allowNull: true,
                },
                PNR: {
                    type: Sequelize.STRING(32),
                    allowNull: true,
                },
                BookingId: {
                    type: Sequelize.STRING(32),
                    allowNull: true,
                },
                // TBO FlightItinerary.Source — mandatory on ReleasePNRRequest.
                source: {
                    type: Sequelize.STRING(16),
                    allowNull: true,
                },
                traceId: {
                    type: Sequelize.STRING(64),
                    allowNull: true,
                },
                resultIndex: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                lastTicketDate: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                // min(createdAt + TTL, lastTicketDate - buffer), floored at a minimum lifetime.
                releaseAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                },
                isPriceChanged: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                isTimeChanged: {
                    type: Sequelize.BOOLEAN,
                    allowNull: false,
                    defaultValue: false,
                },
                fare: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                passengerFares: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                segments: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                passengers: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                userContactDetails: {
                    type: Sequelize.JSON,
                    allowNull: true,
                },
                releasedAt: {
                    type: Sequelize.DATE,
                    allowNull: true,
                },
                releaseError: {
                    type: Sequelize.TEXT,
                    allowNull: true,
                },
                createdAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.NOW,
                },
                updatedAt: {
                    type: Sequelize.DATE,
                    allowNull: false,
                    defaultValue: Sequelize.NOW,
                },
            });
        }

        for (const index of INDEXES) {
            if (!(await hasIndex(queryInterface, index.name))) {
                await queryInterface.addIndex(TABLE, index.fields, { name: index.name });
            }
        }
    },

    async down(queryInterface) {
        if (!(await tableExists(queryInterface))) return;

        await queryInterface.dropTable(TABLE);
    },
};
