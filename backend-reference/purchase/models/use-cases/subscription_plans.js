// const sequelize = require('../../configs/database/index')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async');
const softwares = require('../entities/softwares');



exports.fetchSoftwaresList = asyncHandler(async (query) => {
    return await softwares.findAll({
        where: {
            name: {
                [Op.like]: '%' + query + '%'
            },
            status: true
        },
        attributes: ['id', 'name']
    })
  })