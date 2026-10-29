/* eslint-disable no-unused-vars */
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
const { handleSortFields } = require('../../utils/sortHandle');
const { formattedDateTime, formatNumberWithLocalString } = require('../../utils/formatter');
const { uploadFile } = require('../../utils/commonUploadFile');
exports.create = async (params) => {
    let transaction;
    try {
        transaction = await sequelize.transaction();
        let pictures = [];
    let publicUrl1;

    if (Object.prototype.hasOwnProperty.call(params, 'productImage1') && params.productImageFormat1) {
        publicUrl1 = await uploadFile(params.productImage1, 'productImage1', params.productImageFormat1);
        params.productImage = publicUrl1;
    }

    const products = await product.create(params, {
        transaction: transaction
    })

    if (Object.prototype.hasOwnProperty.call(params, 'productImage1') && params.productImageFormat1) {
        pictures.push({
            productId: products.id,
            productImageUrl: publicUrl1,
            imageField: 'productImage1'
        })
    }
    if (Object.prototype.hasOwnProperty.call(params, 'productImage2') && params.productImageFormat2) {
        const publicUrl = await uploadFile(params.productImage2, 'productImage2', params.productImageFormat2);
        pictures.push({
            productId: products.id,
            productImageUrl: publicUrl,
            imageField: 'productImage2'
        })
    }
    if (Object.prototype.hasOwnProperty.call(params, 'productImage3') && params.productImageFormat3) {
        const publicUrl = await uploadFile(params.productImage3, 'productImage3', params.productImageFormat3);
        pictures.push({
            productId: products.id,
            productImageUrl: publicUrl,
            imageField: 'productImage3'
        })
    }
    if (Object.prototype.hasOwnProperty.call(params, 'productImage4') && params.productImageFormat4) {
        const publicUrl = await uploadFile(params.productImage4, 'productImage4', params.productImageFormat4);
        pictures.push({
            productId: products.id,
            productImageUrl: publicUrl,
            imageField: 'productImage4'
        })
    }

    await photos.bulkCreate(pictures, {
        transaction: transaction
    })

    await transaction.commit();
    if (!products) {
        return false;
    }
    return products
    } catch (error) {
        if (transaction) await transaction.rollback();
        console.error("Product creation failed:", error);
        return false;
    }
    
}

exports.createBulkProducts = asyncHandler(async (params) => {
    let transaction
    try {
    transaction = await sequelize.transaction();
    let pictures = [];
    let publicUrl1;

    if (Object.prototype.hasOwnProperty.call(params, 'productImage1')) {
        publicUrl1 = params.productImage1
        params.productImage = publicUrl1;
    }

    const products = await product.create(params, {
        transaction: transaction
    })

    if (Object.prototype.hasOwnProperty.call(params, 'productImage1')) {
        if (publicUrl1 !== '')
            pictures.push({
                productId: products.id,
                productImageUrl: publicUrl1,
                imageField: 'productImage1'
            })
    }
    if (Object.prototype.hasOwnProperty.call(params, 'productImage2')) {
        const publicUrl = params.productImage2
        if (publicUrl !== '')
            pictures.push({
                productId: products.id,
                productImageUrl: publicUrl,
                imageField: 'productImage2'
            })
    }
    if (Object.prototype.hasOwnProperty.call(params, 'productImage3')) {
        const publicUrl = params.productImage3
        if (publicUrl !== '')
            pictures.push({
                productId: products.id,
                productImageUrl: publicUrl,
                imageField: 'productImage3'
            })
    }


    await photos.bulkCreate(pictures, {
        transaction: transaction
    })

    await transaction.commit();
    if (!products) {
        return false;
    }
    return products
    } catch (error) {
        if (transaction) await transaction.rollback();
            console.error('Error in createBulkProducts:', error);
            return false;
    }
    
})

exports.fetchAllPhotos = asyncHandler(async (productId) => {
    return await photos.findAll({
        where: {
            productId: productId
        }
    });
})

exports.findOne = asyncHandler(async (params, attributes = undefined) => {
    return await product.findOne({
        include: [{
            model: category
        }],
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
    });
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
            status: true,
            quantity: {
                [Op.gt]: 0
            }
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
exports.findAllProducts = asyncHandler(async (params) => {
    try {
        let {
            limit,
            offset,
            searchText,
            sort,
            sortField,
            productsOnly,
            categoryId
        } = params
        let order = handleSortFields(sortField, sort)

        productsOnly = true


        return await product.findAndCountAll({
            include: [{
                model: category,
                attributes: ['id', 'categoryName'],
                where: {
                    categoryStatus: true
                }
            }],
            where: {
                [Op.or]: [{
                    id: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }, {
                    name: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }, {
                    description: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }, {
                    price: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }],
                ...(productsOnly ? {
                    [Op.and]: {
                        '$category.categoryName$': {
                            [Op.not]: 'Subscriptions'
                        }
                    }
                } : {}),
                ...(categoryId ? {
                    [Op.and]: {
                        categoryId: categoryId
                    }
                } : {}),

            },
            order: order,
            limit,
            offset,
            raw: true,
            nest: true
        })
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }
})

exports.fetchProductDetails = asyncHandler(async (query) => {
    return await product.findAll({
        where: {
            name: {
                [Op.like]: '%' + query + '%'
            }
        },
        attributes: ['id', 'name']
    })
})
exports.productAndCountExport = asyncHandler(async (params) => {
    try {
        let {
            searchText,
            sort,
            sortField,
            productsOnly,
            categoryId
        } = params
        let order = handleSortFields(sortField, sort)

        productsOnly = true


        const data = await product.findAndCountAll({
            attributes:["vendors","createdAt","name","description","quantity","price","status"],
            include: [{
                model: category,
                attributes: ['id', 'categoryName'],
                where: {
                    categoryStatus: true
                }
            }],
            where: {
                [Op.or]: [{
                    id: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }, {
                    name: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }, {
                    description: {
                        [Op.like]: '%' + searchText + '%'
                    }
                },{
                    price: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }],
                ...(productsOnly ? {
                    [Op.and]: {
                        '$category.categoryName$': {
                            [Op.not]: 'Subscriptions'
                        }
                    }
                } : {}),
                ...(categoryId ? {
                    [Op.and]: {
                        categoryId: categoryId
                    }
                } : {}),

            },
            order: order,
            raw: true,
            nest: true
        })
        let finalData = []
        data.rows.forEach(function (limitData) {
            // const vendors = typeof limitData.vendors == 'string' ? JSON.parse(limitData.vendors) : limitData.vendors
            // let vendorsName = ""
            // let vendorsPrice = ""
            // if (vendors && vendors.length) {
            //     vendors.forEach((vendor) => {
            //         if (vendor.name) {
            //             const vendorName = typeof vendor.name == 'object' ? vendor.name?.vendorName : vendor.name
            //             vendorsName += ` ${vendorName},`
            //             if (vendor.price) {
            //                 vendorsPrice += ` ₹ ${formatNumberWithLocalString(vendor.price)} ${vendorName},`
            //             }
            //         }
            //     })
            // }
            finalData.push({
                Date: limitData.createdAt ? formattedDateTime(limitData.createdAt) : 'Not Available',
                "Product Name": limitData.name ? limitData.name : "Not Available",
                Description: limitData.description ? limitData.description : "Not Available",
                "Category Name": limitData.category?.categoryName ? limitData.category?.categoryName : "Not Available",
                Quantity: limitData.quantity ? limitData.quantity : "Not Available",
                Price: limitData.price ? "₹ " + formatNumberWithLocalString(limitData.price) : "₹ 0.00",
                Status: limitData.status > 0 ? "Active" : "In Active",
                // "Vendors Name": vendorsName ? vendorsName : "Not Available",
                // "Vendors Price": vendorsPrice ? vendorsPrice : "Not Available",
                // "SKU Code": limitData.SKUCode ? limitData.SKUCode : "Not Available",
            })
        })
        return finalData
    } catch (error) {
        console.log(error);
        throw { message: 'Something went wrong' };
    }
})
exports.getExcelCSVData = asyncHandler(async (params) => {
    const whereClause = {
        '$category.categoryName$': {
            [Op.ne]: 'Subscriptions' // Filter for categoryName not equal to 'Subscription'
        }
    }
    if (params.categoryId) {
        whereClause.categoryId = {
            [Op.eq]: params.categoryId
        };
    }
    if (params.searchText) {
        const decodedSearchText = decodeURIComponent(params.searchText);
        whereClause[Op.or] = [
            {
                id: {
                    [Op.like]: '%' + decodedSearchText + '%'
                }
            },
            {
                name: {
                    [Op.like]: '%' + decodedSearchText + '%'
                }
            },
            {
                description: {
                    [Op.like]: '%' + decodedSearchText + '%'
                }
            }
        ];
    }
    let data = await product.findAll({
        include: [{
            model: category,
            as: "",
            attributes: ['categoryName']
        }],
        attributes: ['id', 'name', 'status', 'description', 'vendorPrice', 'skuCode', 'productImage', 'price', 'quantity'],
        where: whereClause,
        order: [
            ['createdAt', 'DESC']
        ],
        raw: true,
        nest: true

    })
    // console.log('data at product getExcel', data)
    let finalData = []
    data.forEach(function (limitData) {

        finalData.push({
            'Product Code': limitData.Id,
            'Product Name': limitData.name && limitData.name != null ? limitData.name : 'Not Available',
            'Status': limitData.status !== null ? (limitData.status ? 'Available' : 'Not Available') : 'Not Available',
            // 'Description': limitData.description ? limitData.description : 'Not Available',
            'SKU Code': limitData.skuCode ? limitData.skuCode : 'Not Available',
            'Price': limitData.price ? limitData.price + 'INR' : 'Not Available',
            'Vendor Price': limitData.vendorPrice ? limitData.vendorPrice + 'INR' : 'Not Available',
            'Quantity': limitData.quantity ? limitData.quantity : 'Not Available',
            'Category Name': limitData.category.categoryName ? limitData.category.categoryName : 'Not Available',

        })
    })
    return finalData
})

exports.fetchAllCategories = async (params) => {
    try {
        const queryOptions = {
            include: [{
                model: vendors,
                attributes: ['id', 'vendorName'],
                where: {
                    vendorName: {
                        [Op.or]: ['Ecom', 'Subscriptions']
                    }
                }
            }],
            where: {
                categoryStatus: true
            }
        };
        // Check if a search term is provided
        if (params.searchText && params.searchText.trim() !== '') {
            queryOptions.where = {
                ...queryOptions.where,
                // Add search condition
                categoryName: {
                    [Op.like]: `%${params.searchText.trim()}%`
                }
            };
        }
        return await category.findAll(queryOptions);

    } catch (error) {
        console.log(error)
    } finally {
        console.log("CATEGORY FIND ALL ROUTE CALLED")
    }
}

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

exports.fetchProductsWithCategoryId = async (params) => {
    const { page, limit } = params
    return await product.findAndCountAll({
        where: {
            categoryId: params.categoryId,
            status: true
        },
        limit: limit,
        offset: (page - 1) * limit,
        include: [{
            model: category,
            include: [{
                model: vendors,
                where: {
                    vendorName: 'Ecom'
                }
            }]
        }],
        raw: true,
        nest: true
    });
}

exports.fetchVendorsByProductIds = asyncHandler(async (productIds) => {
    const vendors = await product.findAll({
        where: {
            id: [...productIds]
        },
        attributes: ['vendors', 'id', 'name'],
        raw: true
    });

    // // Extract vendors from products and concatenate into a single array
    // const allVendors = products.reduce((acc, product) => {
    //     if (product.vendors) {
    //         acc.push(...product.vendors);
    //     }
    //     return acc;
    // }, []);

    // // Deduplicate the vendors
    // const uniqueVendors = [...new Set(allVendors)];

    return vendors;
});

exports.fetchOneProductId = asyncHandler(async (productId) => {
    const vendors = await product.findOne({
        where: {
            id: productId
        },
        attributes: ['vendors', 'id', 'name'],
        raw: true
    });


    return vendors;
});