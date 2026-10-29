const wallet = require('./../entities/wallet')



const findAllWallets = async () => {
    try {
        return await wallet.findAll({
            raw:true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("WALLET FIND ALL ROUTE CALLED")
    }
}

module.exports = { findAllWallets}
