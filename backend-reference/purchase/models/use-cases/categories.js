const categories = require('../entities/categories')
// const sequelize = require('../../configs/database/index')
const vendors = require('./../entities/vendor')
//const sequelize = require('sequelize')
const product = require('../entities/products')
const {
    Op
} = require("sequelize");
const asyncHandler = require('../../middlewares/async')
const { handleSortFields } = require('../../utils/sortHandle')
const { formattedDateTime } = require('../../utils/formatter');
const { uploadFile } = require('../../utils/commonUploadFile');

exports.create = asyncHandler(async (params) => {
    if (Object.prototype.hasOwnProperty.call(params, 'categoryImage') && params.categoryImageFormat) {
        const publicUrl = await uploadFile(params.categoryImage, 'categoryImage', params.categoryImageFormat);
        //params = {}
        params.categoryImage = publicUrl;
    }
    const category = await categories.create(params);
    if (!category) {
        return false;
    }
    return category
})

exports.find = asyncHandler(async (params) => {
    return await categories.findOne({
        where: {
            id: params.id
        }
    })
})
exports.findByCategoryName = asyncHandler(async (params) => {
    return await categories.findOne({
        where: {
            categoryName: params
        }
    })
})
/*exports.findCategories = asyncHandler(async (params) => {
    console.log("params in categories", params)
    return await categories.findAll({
        where: {
            vendorId: params,
            categoryStatus: true
        }
    })
})*/

exports.findCategories = asyncHandler(async () => {
    return await categories.findAll({
        include: [{
            model: vendors,
            attributes: ['id', 'vendorName'],
            where: {
                vendorName: 'Ecom'
            }
        }],
        where: {
            categoryStatus: true
        }
    })
})

exports.update = asyncHandler(async (params, data) => {
    if (Object.prototype.hasOwnProperty.call(data, 'categoryImage') && data.categoryImageFormat) {
        const publicUrl = await uploadFile(data.categoryImage, 'categoryImage', data.categoryImageFormat);
        data.categoryImage = publicUrl;
    }
    return await categories.update(data, {
        where: {
            id: params.id
        },
    })
})

exports.Delete = async (params) => {
    try {
        return await categories.destroy({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("PAKAGE DELETE ROUTE CALLED")
    }
}

exports.updateStatus = asyncHandler(async (req) => {
    const params = req.params;
    const data = req.body;
    return await categories.update(data, {
        where: {
            id: params.id
        }
    })
});

exports.findCategory = asyncHandler(async (id) => {
    try {
        return await product.findAll({
            where: {
                categoryId: id
            },
            raw: true
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CATEGORY ASSOCIATED WITH PRODUCT ROUTE CALLED")
    }
})

exports.findAllCategories = asyncHandler(async (params, type) => {
    try {
        let { limit, offset, searchText, sort, sortField } = params;

        const order = handleSortFields(sortField || "createdAt", sort || "DESC");

        const whereCondition = {};

        if (searchText) {
            whereCondition[Op.or] = [
                { id: { [Op.like]: `%${searchText}%` } },
                { categoryName: { [Op.like]: `%${searchText}%` } },
                { "$vendor.vendorName$": { [Op.like]: `%${searchText}%` } },
            ];
        }

        if (type) {
            whereCondition["$vendor.type$"] = type;
        }

        const queryOptions = {
            include: [
                {
                    model: vendors,
                    attributes: ["id", "vendorName", "type"],
                },
            ],
            where: whereCondition,
            order,
            raw: true,
            nest: true,
        };

        if (limit) queryOptions.limit = limit;
        if (offset !== undefined) queryOptions.offset = offset;

        return await categories.findAndCountAll(queryOptions);
    } catch (error) {
        console.log(error);
        throw { message: "Something went wrong" };
    }
});

exports.categoriesAndCountExport = asyncHandler(async (params, type) => {
    try{
        let {
            searchText,
            sort,
            sortField,
        } = params;
        let order = handleSortFields(sortField,sort)
       
        const whereCondition = {
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                categoryName: {
                    [Op.like]: '%' + searchText + '%'
                }
            },{
                '$vendor.vendorName$': {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        };
    
        if (type) {
            whereCondition['$vendor.type$'] = type;
        }
    
        const data = await categories.findAndCountAll({
            include: [{
                model: vendors,
                attributes: ['id', 'vendorName', 'type'], 
            }],
            where: whereCondition,
            order: order,
            raw: true,
            nest: true
        });
        let finalData = [];
        data.rows.forEach(function (limitData) {
          finalData.push({
            Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : "Not Available",
            "Category Name": limitData.categoryName ? limitData.categoryName : "Not Available",
            "Vendor Name": limitData.vendor?.vendorName ? limitData.vendor?.vendorName : "Not Available",
            Status: limitData.categoryStatus>0 ? "Active"  : "In Active",
          });
        });
        return finalData;
    } catch (error) {
      console.log(error);
      throw  {message:'Something went wrong'};
    }
});


exports.fetchCategoryDetails = asyncHandler(async (query) => {
    return await categories.findAll({
        where: {
            categoryName: {
                [Op.like]: '%' + query + '%'
            }
        },
        attributes: ['id', 'categoryName']
    })
})

exports.getExcelCSVData = asyncHandler(async () => {
    let data = await categories.findAll({
        include: [{
            model: vendors,
            as: '',
            attributes: ['vendorName']
        }],
        attributes: ['id', 'categoryName', 'categoryStatus', 'categoryImage'],
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true

    })
    let finalData = []
    data.forEach(function (limitData) {
        finalData.push({
            'ID': limitData.id,
            'Category Name': limitData.categoryName ? limitData.categoryName : 'Not Available',
            'Status': limitData.categoryStatus !== null ? (limitData.categoryStatus ? 'Active' : 'Inactive') : 'Not Available',
            'Category Image': limitData.categoryImage ? limitData.categoryImage : 'Not Available',
            'Vendor Name': limitData.vendor.vendorName ? limitData.vendor.vendorName : 'Not Available'
        })
    })
    return finalData
})