/* eslint-disable no-unused-vars */
const wallet = require('../entities/wallet')
// const sequelize = require('sequelize')
// const moment = require('moment')
// const {Op} = require("sequelize");

const findAllWallets = async (params) => {
    try {
        return await wallet.findAll({
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("WALLET FIND ALL ROUTE CALLED")
    }
}

const findOneWallet = async (credentialId) => {
    try {
        return await wallet.findOne({
            where: {
                credentialId: credentialId,
            },
            raw: true,
            attributes: ["balance"],
        });
    } catch (error) {
        console.log(error)
        return false
    }
}

module.exports = { findAllWallets ,findOneWallet}
