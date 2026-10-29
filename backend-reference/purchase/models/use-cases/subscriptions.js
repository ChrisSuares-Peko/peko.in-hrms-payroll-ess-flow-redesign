const product = require('../entities/products')
const sequelize = require('../../configs/database/index')
const category = require('../entities/categories');
const vendors = require('../entities/vendor');
//const sequelize = require('sequelize')
// const moment = require('moment')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async')
// const {
//     findAllAndCount
// } = require("./systemUser");
const photos = require('../entities/photos');
const { uploadFile } = require('../../utils/commonUploadFile');

exports.create = async (params) => {
    let transaction;
  
    try {
      transaction = await sequelize.transaction();
      const pictures = [];
      let publicUrl1;
  
      // Upload and set main product image
      if (params.productImage1 && params.productImageFormat1) {
        publicUrl1 = await uploadFile(params.productImage1, 'productImage1', params.productImageFormat1);
        params.productImage = publicUrl1;
      }
  
      // Create product
      const productResult = await product.create(params, { transaction });
  
      if (!productResult) {
        await transaction.rollback();
        return false;
      }
  
      // Save image record if exists
      if (publicUrl1) {
        pictures.push({
          productId: productResult.id,
          productImageUrl: publicUrl1,
          imageField: 'productImage1',
        });
  
        await photos.bulkCreate(pictures, { transaction });
      }
  
      await transaction.commit();
      return productResult;
  
    } catch (error) {
      if (transaction) await transaction.rollback();
      console.error('Error in product create:', error);
      return false;
    }
  };
  

exports.fetchAllPhotos = asyncHandler(async (productId) => {
    return await photos.findAll({
        where: {
            productId: productId
        }
    });
})

exports.findOne = asyncHandler(async (params, attributes = undefined) => {
    return await product.findOne({
        where: {
            id: params.productCode
        },
        attributes
    })
})

exports.find = asyncHandler(async (name) => {
    return await product.findOne({
        where: {
            name: name
        }
    })
})

exports.findAllProduct = async (params) => {
    try {
        const {
            categories,
            searchText,
            offset,
            limit
        } = params;

        let whereClauseCategory = {};
        let whereClauseProducts = {
            status: true
        };

        if (categories && categories.length > 0) {
            whereClauseCategory = {
                id: {
                    [Op.in]: categories
                }
            };
        } else {
            whereClauseCategory = {
                categoryStatus: true
            };
        }

        if (searchText !== "undefined") {
            whereClauseProducts['name'] = {
                [Op.like]: '%' + searchText + '%'
            };
        }
        // Handle different sorting scenarios
        let orderCriteria = [];
        if (params.sortMethod === 'name') {
            orderCriteria.push(['name', 'ASC']);
        } else if (params.sortMethod === 'recent') {
            orderCriteria.push(['createdAt', 'DESC']);
        } else if (params.sortMethod === 'popular' && params.popular) {
            whereClauseProducts['id'] = {
                [Op.in]: params.popular
            };
        }


        const productList = await product.findAndCountAll({
            include: [{
                model: category,
                include: [{
                    model: vendors,
                    where: {
                        vendorName: 'Ecom'
                    }
                }],
                where: whereClauseCategory
            }],
            offset,
            limit,
            raw: true,
            nest: true,
            where: whereClauseProducts,
            order: orderCriteria
        });

        return productList;
    } catch (error) {
        console.log(error);
        throw error;
    } finally {
        console.log("PRODUCT FIND ALL ROUTE CALLED");
    }
};


exports.update = asyncHandler(async (params, data) => {
    // let transaction = await sequelize.transaction();
    if (Object.prototype.hasOwnProperty.call(data, 'productImage1') && data.productImageFormat1) {
        const publicUrl = await uploadFile(data.productImage1, 'productImage1', data.productImageFormat1);
        data.productImage = publicUrl;
        await updateImgUrl(publicUrl, params.id, 'productImage1')
    }
    if (Object.prototype.hasOwnProperty.call(data, 'productImage2') && data.productImageFormat2) {
        const publicUrl = await uploadFile(data.productImage2, 'productImage2', data.productImageFormat2);
        await updateImgUrl(publicUrl, params.id, 'productImage2')
    }
    if (Object.prototype.hasOwnProperty.call(data, 'productImage3') && data.productImageFormat3) {
        const publicUrl = await uploadFile(data.productImage3, 'productImage3', data.productImageFormat3);
        await updateImgUrl(publicUrl, params.id, 'productImage3')
    }
    if (Object.prototype.hasOwnProperty.call(data, 'productImage4') && data.productImageFormat4) {
        const publicUrl = await uploadFile(data.productImage4, 'productImage4', data.productImageFormat4);
        await updateImgUrl(publicUrl, params.id, 'productImage4')
    }
    return await product.update(data, {
        where: {
            id: params.id
        },
        //transaction: transaction
    })
})

async function updateImgUrl(newUrl, productId, imageField) {
    console.log(newUrl, productId, imageField)
    try {
        const [updatedCount] = await photos.update({
            productImageUrl: newUrl
        }, {
            where: {
                productId: productId,
                imageField: imageField
            }
        });

        if (updatedCount === 0) {
            await photos.create({
                productId: productId,
                imageField: imageField,
                productImageUrl: newUrl
            });
            return true;
        } else {
            return true;
        }
    } catch (error) {
        // console.error(`Error updating/creating URL: ${error.message}`);
        // throw error; // You can choose to handle the error as needed
        return false;
    }
}

exports.updateStatus = asyncHandler(async (req) => {
    const params = req.params;
    const data = req.body;
    console.log("data in usecase", data)
    console.log("params in usecase", params)
    return await product.update(data, {
        where: {
            id: params.id
        }
    })
});

exports.Delete = asyncHandler(async (params) => {
    return await product.destroy({
        where: {
            id: params.productCode
        }
    })
})
exports.findAllSubscriptions = asyncHandler(async (params) => {
    let {
        start,
        length,
        searchText,
        order,
        column,
    } = params
    const sortableColumns = [
        'name',
        'description',
        'category.categoryName',
        'quantity',
        'price',
        'status',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }

    return await product.findAndCountAll({
        include: [{
            model: category,
            as: '',
            attributes: ['id', 'categoryName']
        }],
        where: {
            [Op.and]: [
                {
                    [Op.or]: [
                        { id: { [Op.like]: '%' + searchText + '%' } },
                        { name: { [Op.like]: '%' + searchText + '%' } },
                        { description: { [Op.like]: '%' + searchText + '%' } },
                    ],
                },
                sequelize.literal('`category`.`categoryName` = "Subscriptions"') // Filter for categoryName equals "Subscriptions"
            ],
        },
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true
    })
})

exports.fetchSubscriptionDetails = asyncHandler(async (query) => {
    return await product.findAll({
        where: {
            name: {
                [Op.like]: '%' + query + '%'
            }
        },
        attributes: ['id', 'name']
    })
})

exports.getExcelCSVData = asyncHandler(async () => {
    let data = await product.findAll({
        include: [{
            model: category,
            as: "",
            attributes: ['categoryName']
        }],
        where: {
            '$category.categoryName$': 'Subscriptions'
        },
        attributes: ['Id', 'name', 'status', 'description', 'skuCode', 'highlights', 'price', 'quantity'],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true

    })
    let finalData = []
    data.forEach(function (limitData) {
        finalData.push({
            'Product Code': limitData.Id,
            'Product Name': limitData.name && limitData.name != null ? limitData.name : 'Not Available',
            'Description': limitData.description ? limitData.description : 'Not Available',
            'Includes': limitData.highlights ? limitData.highlights : 'Not Available',
            'Price': limitData.price ? limitData.price + 'INR' : 'Not Available',
            'Quantity': limitData.quantity ? limitData.quantity : 'Not Available',
            'Status': limitData.status !== null ? (limitData.status ? 'Available' : 'Not Available') : 'Not Available',

        })
    })
    return finalData
})



exports.findProductsByIds = asyncHandler(async (productCodes, attributes = undefined) => {
    return await product.findAll({
        where: {
            id: productCodes
        },
        attributes
    });
});

exports.fetchCounts = async () => {
    return await product.findAndCountAll({
        include: [{
            model: category,
            as: '',
            attributes: ['categoryName']
        }],
        where: {
            [Op.and]: {
                '$category.categoryName$': {
                    [Op.not]: 'Subscriptions'
                }
            }
        },
        raw: true,
        nest: true,
        distinct: true,
        count: {
            col: 'id'
        }
    });
}
