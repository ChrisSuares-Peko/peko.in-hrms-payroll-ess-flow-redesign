const giftCards = require('../../models/entities/giftCards');
const sequelize = require('../../configs/database/index')
const vendor = require('../entities/vendor')
const serviceOperator = require('../entities/serviceOperator')

const asyncHandler = require('../../middlewares/async')
const {
    Op
} = require("sequelize");
const { formattedDateTime } = require('../../utils/formatter');
const { customLog } = require('../../utils/loggerHelper');
const { handleSortFields } = require('../../utils/sortHandle');
const { uploadFile } = require('../../utils/commonUploadFile');

const uploadAndSetImage = async (params, paramName, folderName) => {
    if (params[paramName] && params[paramName] instanceof Object) {
        const { imageBase, imageFormat } = params[paramName];
        const filePath = `${folderName}/${paramName}`
        params[paramName] = await uploadFile(imageBase, filePath, imageFormat);    
    }
};


exports.create = asyncHandler(async (params) => {
    await uploadAndSetImage(params, 'brand_logo', 'GiftCards');

    const giftCard = await giftCards.create(params)
    if (!giftCard) {
        return false;
    }
    return giftCard
})

exports.bulkCreate = async (params) => {
    let transaction;
  
    try {
      transaction = await sequelize.transaction();
  
      // No image upload; image URLs are provided in Excel bulk upload
      const giftCard = await giftCards.bulkCreate(params, {
        transaction,
      });
  
      await transaction.commit();
      return giftCard;
  
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error("Error in bulkCreate giftCards:", error);
      return false;
    }
  };
  

exports.findByAnyField = asyncHandler(async (query) => {
    return await giftCards.findOne({
        // include: [{
        //     model: serviceOperators,
        //     as: 'serviceOperator',
        //     attributes: ['accessKey']
        // }],
        where: query
    })
})

exports.findSingleGiftCard = asyncHandler(async (giftCardId) => {
    return await giftCards.findOne({
        include: [
            {
                model: serviceOperator,
                as: 'serviceOperator',
                attributes: ['accessKey'],
            },
        ],
        where: {
            id: giftCardId
        },
        attributes: {
            exclude: ['createdAt', 'updatedAt']
        }
    })
})



exports.update = asyncHandler(async (id, params) => {
    await uploadAndSetImage(params, 'brand_logo', 'GiftCards');
    return await giftCards.update(params, {
        where: {
            id: id
        }
    })
})

exports.updateStatusByServiceOperatorId = asyncHandler(async (serviceOperatorId, params) => {
    return await giftCards.update(params, {
        where: {
            serviceOperatorId: serviceOperatorId
        }
    })
})

exports.findAllGiftCardIdsByServiceOperatorId = asyncHandler(async (serviceOperatorId) => {
    const giftCardsData = await giftCards.findAll({
        where: {
            serviceOperatorId: serviceOperatorId
        }
    });

    // Convert the result to a Map
    const giftCardMap = new Map(giftCardsData.map(giftCard => [giftCard.product_id, giftCard]));

    return giftCardMap;
});






exports.findAllGiftCard = async (params,req) => {
    try {
        const { offset, limit,  searchText, popularCards, sortMethod } = params; 

        const order = 'ASC'
        const column = sortMethod || "createdAt"
        console.log(column, order, "<<=========================================");

        customLog(req?.LogTraceId, "info", { message:" column, order" , data: { column, order } });


        let whereClauseProducts = {
            status: true,
            [Op.or]: [{
                product_name: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                product_id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                brand_name: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        };

        if (popularCards && popularCards.length > 0) {
            whereClauseProducts.id = {
                [Op.in]: popularCards
            };
        }

        const queryOptions = {
            // include: [
            //     {
            //         model: serviceOperators,
            //         as: 'serviceOperator',
            //         attributes: ['accessKey'],
            //         where: {
            //             accessKey: {
            //                 [sequelize.Op.in]: accessKeys 
            //             }
            //         }
            //     }
            // ],
            offset,
            limit,
            raw: true,
            nest: true,
            where: whereClauseProducts
        };
        
        if (sortMethod &&sortMethod != 'popular' ) {
            queryOptions.order = [
                [column, order]
            ];
        }
        
        return await giftCards.findAndCountAll(queryOptions);
        
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
        customLog(req?.LogTraceId, "info", { message: "PRODUCT FIND ALL ROUTE CALLED" });

    }
}



exports.findAllGiftCards = asyncHandler(async (params) => {
    let { limit, offset, searchText, sort, sortField } = params
  let order = handleSortFields(sortField, sort)
    return await giftCards.findAndCountAll({
        where: {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                product_name: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                product_id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                brand_name: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        },
        order: order,
        limit,
        offset
    })
})

exports.giftCardsAndCountExport = asyncHandler(async (params) => {
     try {
          let { searchText, sort, sortField } = params
          let order = handleSortFields(sortField, sort)

          const data = await giftCards.findAndCountAll({
               where: {
                    [Op.or]: [
                         {
                              id: {
                                   [Op.like]: '%' + searchText + '%',
                              },
                         },
                         {
                              product_name: {
                                   [Op.like]: '%' + searchText + '%',
                              },
                         },
                         {
                              product_id: {
                                   [Op.like]: '%' + searchText + '%',
                              },
                         },
                         {
                              brand_name: {
                                   [Op.like]: '%' + searchText + '%',
                              },
                         },
                    ],
               },
               order: order,
          })
          let finalData = []
          data.rows.forEach(function (limitData) {
               finalData.push({
                    Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                    Name: limitData.product_name ? limitData.product_name : 'Not Available',
                    'Price Type': limitData.is_open_denominnation ? `Open` : `Fixed`,
                    'Price Range': `Min: ${limitData.min_price ?? '0.00'} - Max: ${limitData.max_price ?? '0.00'}`,
                    Currency: limitData.currency ? limitData.currency : 'INR',
                    Status: limitData.status ? 'Active' : 'In Active',
               })
          })
          return finalData
     } catch (error) {
          console.log('giftCards.getDataFromTable error:', error?.message)
          throw { message: 'Something went wrong' }
     }
})

exports.getExcelCSVData = asyncHandler(async () => {
    let data = await giftCards.findAll({
        attributes: ['id', 'name', 'priceType', 'minDenomination', 'maxDenomination', 'currency',
        ],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true

    })

    let finalData = []
    data.forEach(function (limitData) {
        finalData.push({
            'GiftCard Id': limitData.id,
            'GiftCard Name': limitData.name,
            'Price Type': limitData.priceType,
            'Price Range': `Min: ${limitData.minDenomination} - Max: ${limitData.maxDenomination}`,
            'Currency': limitData.currency ? limitData.currency : 'Not Available',
        })
    })
    return finalData
})

exports.findVendorById = asyncHandler(async (venderId) => {
    return await vendor.findOne({
        where: {
            id: venderId
        }
    })
})
exports.findServiceOperatorById = asyncHandler(async (serviceOperatorId) => {
    return await serviceOperator.findOne({
        include: [{
            model: vendor,
            as: 'vendor'
        }],
        where: {
            id: serviceOperatorId
        }
    })
})
exports.findServiceOperatorByAccessKey = asyncHandler(async (accessKey) => {
    return await serviceOperator.findOne({
        include: [{
            model: vendor,
            as: 'vendor'
        }],
        where: {
            accessKey: accessKey
        }
    })
})

exports.updateAllStatus = asyncHandler(async (params) => {
    return await giftCards.update(params,{
        where: {}
    })
})
