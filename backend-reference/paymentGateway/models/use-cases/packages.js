const Package = require('../entities/package')


exports.findOnePackage = async (id) => {
    return await Package.findOne({ where: {id}})
}