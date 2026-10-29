'use strict';

const PurchaseOrderNote = require('../../entities/PurchaseOrderNote');
const PurchaseOrder     = require('../../entities/PurchaseOrder');
const CorporateUser     = require('../../entities/corporateUser');

if (!PurchaseOrderNote.associations.author) {
  PurchaseOrderNote.belongsTo(CorporateUser, { foreignKey: 'corporateUserId', as: 'author' });
}

exports.findPurchaseOrder = async ({ id, corporateUserId }) => {
  return PurchaseOrder.findOne({ where: { id, corporateUserId } });
};

exports.addNote = async ({ purchaseOrderId, corporateUserId, note }) => {
  return PurchaseOrderNote.create({ purchaseOrderId, corporateUserId, note });
};

exports.listNotes = async ({ purchaseOrderId }) => {
  return PurchaseOrderNote.findAll({
    where:   { purchaseOrderId },
    include: [{ model: CorporateUser, as: 'author', attributes: ['firstName', 'lastName','contactPersonName'] }],
    order:   [['createdAt', 'DESC']],
  });
};
