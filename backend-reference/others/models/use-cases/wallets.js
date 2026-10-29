const credential = require('../entities/credential')
const wallet = require('./../entities/wallet')

const findAllWallets = async () => {
     try {
          return await wallet.findAll({
               raw: true,
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('WALLET FIND ALL ROUTE CALLED')
     }
}

const findOneWallets = async (id, walletAttribute = undefined, credentialAttribute = undefined) => {
     try {
          return await wallet.findOne({
               where: {
                    credentialId: id,
               },
               attributes: walletAttribute,
               include: [
                    {
                         model: credential,
                         attributes: credentialAttribute,
                    },
               ],
               raw: true,
          })
     } catch (error) {
          console.log(error)
     } finally {
          console.log('WALLET FIND ALL ROUTE CALLED')
     }
}

module.exports = { findAllWallets, findOneWallets }
