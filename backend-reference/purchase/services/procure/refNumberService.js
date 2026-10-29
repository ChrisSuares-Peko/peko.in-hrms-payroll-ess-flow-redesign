'use strict';
const { Op, Transaction } = require('sequelize');
const sequelize = require('../../configs/database/index');

/**
 * Model map — loaded lazily to avoid circular require issues at startup.
 * Add new prefixes here as modules are built.
 */
const getModel = (prefix) => {
  const map = {
    PR:  () => require('../../models/entities/PurchaseRequest'),
    RFQ: () => require('../../models/entities/RFQ'),
    RFP: () => require('../../models/entities/RFQ'),
    RFI: () => require('../../models/entities/RFQ'),
    PO:   () => require('../../models/entities/PurchaseOrder'),
    PROP: () => require('../../models/entities/Proposal'),
  };
  if (!map[prefix]) throw new Error(`refNumberService: unknown prefix "${prefix}"`);
  return map[prefix]();
};

/**
 * Generate the next sequential ref number for a given prefix + org.
 *
 * Uses SELECT ... FOR UPDATE inside a transaction to prevent duplicate
 * ref numbers under concurrent requests.
 *
 * @param {string} prefix          'PR' | 'RFQ' | 'PO' | 'INV' | 'PROP'
 * @param {number} corporateUserId
 * @returns {Promise<string>}       e.g. 'PR-2026-001'
 */
exports.generate = async (prefix, corporateUserId) => {
  const Model = getModel(prefix);
  const year = new Date().getFullYear();
  const like = `${prefix}-${year}-%`;

  return sequelize.transaction(
    { isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE },
    async (t) => {
      const latest = await Model.findOne({
        where: {
          corporateUserId,
          refNumber: { [Op.like]: like },
        },
        order: [['id', 'DESC']],
        attributes: ['refNumber'],
        lock: t.LOCK.UPDATE,
        paranoid: false,
        transaction: t,
      });

      let nextSeq = 1;
      if (latest) {
        const parts = latest.refNumber.split('-');
        const parsed = parseInt(parts[2], 10);
        if (!isNaN(parsed)) nextSeq = parsed + 1;
      }

      return `${prefix}-${year}-${String(nextSeq).padStart(3, '0')}`;
    }
  );
};
