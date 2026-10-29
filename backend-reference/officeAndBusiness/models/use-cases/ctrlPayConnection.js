'use strict';

const { Op } = require('sequelize');

const CtrlPayConnection = require('../entities/ctrlPayConnection');

exports.findCtrlPayConnection = (corporateId) =>
    CtrlPayConnection.findOne({ where: { corporateId }, raw: true });

exports.findLinkedCtrlPayConnection = (subject, corporateId) =>
    CtrlPayConnection.findOne({
        where: { subject, corporateId: { [Op.ne]: corporateId }, status: { [Op.ne]: 'DISCONNECTED' } },
        raw: true,
    });

exports.saveCtrlPayConnection = async (corporateId, fields) => {
    const existing = await CtrlPayConnection.findOne({ where: { corporateId }, attributes: ['id'], raw: true });
    if (existing) {
        await CtrlPayConnection.update(fields, { where: { corporateId } });
    } else {
        await CtrlPayConnection.create({ corporateId, ...fields });
    }
    return CtrlPayConnection.findOne({ where: { corporateId }, raw: true });
};

exports.updateCtrlPayConnection = (corporateId, fields) =>
    CtrlPayConnection.update(fields, { where: { corporateId } });
