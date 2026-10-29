'use strict'

/**
 * Creates `ondcSellers` — one row per ONDC seller (bppId + providerId) holding
 * the payout account and tax identity from on_init plus its Cashfree Easy Split
 * vendor registration.
 *
 * House pattern is that entity files create their own tables on boot via
 * sync()/ensureTable, and migrations only patch columns. This one creates the
 * table if it is absent AND patches any missing column, so it is idempotent both
 * on a fresh database (migrate before first boot) and after
 * models/entities/ondc_seller.js has already run its ensureOndcSellersTable().
 */
const ONDC_SELLERS = 'ondcSellers'

const COLUMNS = (Sequelize) => ({
  bppId: { type: Sequelize.STRING, allowNull: false },
  bppUri: { type: Sequelize.TEXT, allowNull: true },
  providerId: { type: Sequelize.STRING, allowNull: false },
  vendorName: { type: Sequelize.STRING, allowNull: true },
  domain: { type: Sequelize.STRING, allowNull: true },

  settlementType: { type: Sequelize.STRING, allowNull: true },
  settlementCounterparty: { type: Sequelize.STRING, allowNull: true },
  settlementPhase: { type: Sequelize.STRING, allowNull: true },
  upiAddress: { type: Sequelize.STRING, allowNull: true },
  settlementBankAccountNo: { type: Sequelize.STRING, allowNull: true },
  settlementIfscCode: { type: Sequelize.STRING, allowNull: true },
  beneficiaryName: { type: Sequelize.STRING, allowNull: true },
  bankName: { type: Sequelize.STRING, allowNull: true },
  branchName: { type: Sequelize.STRING, allowNull: true },
  settlementDetails: { type: Sequelize.JSON, allowNull: true },
  collectedBy: { type: Sequelize.STRING, allowNull: true },
  buyerFinderFeeType: { type: Sequelize.STRING, allowNull: true },
  buyerFinderFeeAmount: { type: Sequelize.STRING, allowNull: true },

  gstNumber: { type: Sequelize.STRING, allowNull: true },
  panNumber: { type: Sequelize.STRING, allowNull: true },
  bppTerms: { type: Sequelize.JSON, allowNull: true },

  cashfreeVendorId: { type: Sequelize.STRING, allowNull: true },
  cashfreeVendorStatus: { type: Sequelize.STRING, allowNull: true },
  splitEligible: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
  ineligibleReason: { type: Sequelize.STRING, allowNull: true },
  vendorSyncedAt: { type: Sequelize.DATE, allowNull: true },
  lastSyncError: { type: Sequelize.TEXT, allowNull: true },

  lastInitTransactionId: { type: Sequelize.STRING, allowNull: true },
  lastSeenAt: { type: Sequelize.DATE, allowNull: true },
})

const INDEXES = [
  { name: 'ondc_sellers_bpp_provider', fields: ['bppId', 'providerId'], unique: true },
  { name: 'ondc_sellers_cashfree_vendor', fields: ['cashfreeVendorId'] },
  { name: 'ondc_sellers_split_eligible', fields: ['splitEligible'] },
]

const hasTable = async (queryInterface, table) => {
  const tables = await queryInterface.showAllTables()
  return tables.some((t) => String(t).toLowerCase() === table.toLowerCase())
}

module.exports = {
  async up(queryInterface, Sequelize) {
    if (!(await hasTable(queryInterface, ONDC_SELLERS))) {
      await queryInterface.createTable(ONDC_SELLERS, {
        id: { type: Sequelize.BIGINT, autoIncrement: true, primaryKey: true },
        ...COLUMNS(Sequelize),
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
      })
    } else {
      const desc = await queryInterface.describeTable(ONDC_SELLERS)
      for (const [name, definition] of Object.entries(COLUMNS(Sequelize))) {
        if (!desc[name]) await queryInterface.addColumn(ONDC_SELLERS, name, definition)
      }
    }

    const existing = await queryInterface.showIndex(ONDC_SELLERS)
    const existingNames = new Set(existing.map((i) => i.name))
    for (const idx of INDEXES) {
      if (!existingNames.has(idx.name)) {
        await queryInterface.addIndex(ONDC_SELLERS, idx.fields, {
          name: idx.name,
          unique: idx.unique || false,
        })
      }
    }
  },

  async down(queryInterface) {
    if (await hasTable(queryInterface, ONDC_SELLERS)) {
      await queryInterface.dropTable(ONDC_SELLERS)
    }
  },
}
