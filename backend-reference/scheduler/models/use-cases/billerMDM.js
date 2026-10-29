'use strict';
const { Op } = require('sequelize');
const billerMDM = require('../entities/billerMDM');

async function findAllActive() {
  return billerMDM.findAll({ where: { status: 'active' } });
}

async function upsertBillerData(billerId, data) {
  const updateFields = { billerId, data };
  if (data.billerName != null)     updateFields.billerName     = data.billerName;
  if (data.billerCategory != null) updateFields.billerCategory = data.billerCategory;
  if (data.billerCoverage != null) updateFields.billerCoverage = data.billerCoverage;
  await billerMDM.upsert(updateFields);
}

async function updateStatus(billerIds, status) {
  await billerMDM.update({ status }, { where: { billerId: { [Op.in]: billerIds } } });
}

module.exports = { findAllActive, upsertBillerData, updateStatus };
