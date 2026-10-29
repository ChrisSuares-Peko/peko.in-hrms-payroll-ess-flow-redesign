const disableService = require('./../entities/disabledService')
const serviceOperator = require('./../entities/serviceOperator')
const credential = require('./../entities/credential')
// const sequelize = require('sequelize')
// const moment = require('moment')
const { Op } = require("sequelize");
const asyncHandler = require('./../../middlewares/async');
const { handleSortFields } = require('../../utils/sortHandle');
// const ErrorResponse = require('./../../utils/error-response')

exports.create = asyncHandler(async (params) => {
    return await disableService.bulkCreate(params);
})

exports.Delete = asyncHandler(async (params) => {
    let { id } = params
    return await disableService.destroy({
        where: {
            id
        }
    })
})

exports.findAll = asyncHandler(async (params) => {
    try {
        let { limit, offset, searchText, sort, sortField } = params;

        const order = handleSortFields(sortField, sort);

        let whereClause = {};

        if (searchText) {
            whereClause[Op.or] = [
                { id: { [Op.like]: `%${searchText}%` } },
                { '$credential.name$': { [Op.like]: `%${searchText}%` } },
                { '$credential.username$': { [Op.like]: `%${searchText}%` } },
                { '$credential.subPartner.name$': { [Op.like]: `%${searchText}%` } },
                { '$credential.registeredByCredential.name$': { [Op.like]: `%${searchText}%` } },
                { '$credential.id$': { [Op.like]: `%${searchText}%` } },
                { '$serviceOperator.serviceProvider$': { [Op.like]: `%${searchText}%` } },
            ];
        }

        const data = await disableService.findAndCountAll({
            include: [
                {
                    model: serviceOperator,
                    attributes: ['serviceProvider'],
                },
                {
                    model: credential,
                    attributes: ['name', 'username', 'id', 'subPartnerId', 'registeredBy'],
                    include: [
                        {
                            model: credential,
                            as: 'subPartner',
                            attributes: ['id', 'name', 'username'],
                        },
                        {
                            model: credential,
                            as: 'registeredByCredential',
                            attributes: ['id', 'name', 'username'],
                        },
                    ],
                },
            ],
            where: whereClause,
            order,
            limit,
            offset,
            raw: true,
            nest: true,
        })

        return data
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }
})
exports.transactionsAndCountExport = asyncHandler(async (params) => {
    try {
      let { searchText, sort, sortField } = params;
      let order = handleSortFields(sortField, sort);
  
      const whereClause = {};
  
      if (searchText) {
        whereClause[Op.or] = [
          { id: { [Op.like]: `%${searchText}%` } },
          { '$credential.name$': { [Op.like]: `%${searchText}%` } },
          { '$credential.username$': { [Op.like]: `%${searchText}%` } },
          { '$serviceOperator.serviceProvider$': { [Op.like]: `%${searchText}%` } },
        ];
      }
  
      const data = await disableService.findAll({
        include: [
          {
            model: serviceOperator,
            attributes: ['serviceProvider'],
          },
          {
            model: credential,
            attributes: ['name', 'username'],
          },
        ],
        where: whereClause,
        order,
        raw: true,
        nest: true,
      });
  
      let finalData = [];
  
      data.forEach((limitData) => {
        finalData.push({
          "Service Operator": limitData.serviceOperator?.serviceProvider || "Not Available",
          "Corporate ID": limitData.credential?.username || "Not Available",
          "Corporate Name": limitData.credential?.name || "Not Available",
          Status: limitData.serviceStatus ? "Active" : "In Active",
        });
      });
  
      return finalData;
    } catch (error) {
      console.log(error);
      throw { message: "Something went wrong" };
    }
  });

exports.findOne = asyncHandler(async (params) => {
    let { credentialId, serviceOperatorId } = params
    return await disableService.findOne({
        where: {
            credentialId,
            serviceOperatorId,
            serviceStatus: true
        }
    })
})

exports.getExcel = asyncHandler(async () => {
    const data = await disableService.findAndCountAll({
        include: [
            {
                model: serviceOperator, 
                attributes: ['serviceProvider']
            },
            {
                model: credential, 
                attributes: ['name']
            }
        ],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true
    })
    let finalData = []
    data.rows.forEach(function (limitData) {
        finalData.push({
            'ID': limitData.Id,
            'Service Operator': limitData?.serviceOperator?.serviceProvider ?? 'Not Available',
            'CorporateId': limitData.credentialId ? limitData.credentialId : 'Not Available',
            'Corporate Name': limitData?.credential?.name ? limitData.credential.name : 'Not Available',
            'Service Status': limitData.serviceStatus ? limitData.serviceStatus : 'Not Available'
        })
    })
    return finalData
})

exports.find = asyncHandler(async (params) => {
    const { serviceOperatorIds, credentialId } = params;

    return await disableService.findOne({
        where: {
            credentialId,
            serviceOperatorId: {
                [Op.in]: serviceOperatorIds,
            },
        }
    })
})