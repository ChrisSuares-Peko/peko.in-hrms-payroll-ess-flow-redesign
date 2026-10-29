const order = require('./../entities/order')
const moment = require('moment')
const transaction = require('./../entities/transaction')
const orders = require('./../entities/order')
const serviceOperator = require('./../entities/serviceOperator')
const credential = require('./../entities/credential')
const {
    Op
} = require("sequelize");
const createOrder = async (params) => {
    try {
        return await order.create(params)
    } catch (error) {
        console.log(error.message)
    } finally {
        console.log("ORDER CREATE ROUTE CALLED")
    }
}

const findOneOrder = async (params) => {
    try {
        return await order.findOne({
            where: {
                corporateTxnId: params.corporateTxnId
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("ORDER FIND ONE ROUTE CALLED")
    }
}

const findAllOrder = async (params) => {
    try {
        return await order.findAll({
            where: {
                orderId: params.orderId
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("ORDER FIND ALL ROUTE CALLED")
    }
}

const updateOrder = async (params, data) => {
    try {
        return await order.update(data, {
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("Update route called")
    }
}

const deleteOrder = async (params) => {
    try {
        return await order.destroy({
            where: {
                orderId: params.orderId
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("ORDER DELETE ROUTE CALLED")
    }
}
const getExcel = async (params) => {
        let {
            from,
            to,
            order,
            column,
            corporateId,
            categoryName
        } = params


        let whereClause = {
            transactionDate: {
                            [Op.between]: [from, to]
                        }
        }
        if (corporateId) {
            whereClause.credentialId = corporateId
        }
        if (categoryName != "null") {
            whereClause.transactionCategory = categoryName
        }
        let includeOptions = [{
            model: serviceOperator,
            // where: {
            //     serviceCategory: categoryName,
                // [Op.or]: [{
                //     serviceProvider: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // }]
            // },
            // required:  false,

        },
        {
            model: credential,

        },
        {
            model: orders,

        }
    ];
        // if (categoryName != null ) {
        //     console.log('if')
        //     includeOptions[0].where.serviceCategory = categoryName;
        // } else {
        //     console.log('else')
        //     delete includeOptions[0].where.serviceCategory;
        // }
        // console.log(includeOptions)

        let data = await transaction.findAndCountAll({
            include: includeOptions,
            where: whereClause,
            order: [
                [column, order]
            ],
            raw: true,
            nest: true
        })

        let finalData = []
        data.rows.forEach(function (limitData) {
            finalData.push({
                'Date': limitData.transactionDate ? moment(limitData.transactionDate).format('YYYY-MM-DD HH:mm:ss') : 'Not Available',
                'Corporate Name': limitData.credential.name ? limitData.credential.name : 'Not Available',
                'Order Id': limitData.providerId ? limitData.providerId : 'Not Available',
                'Transaction Id': limitData.corporateTxnId ? (limitData.corporateTxnId).toString() : 'Not Available',
                'Category': limitData.transactionCategory ? limitData.transactionCategory : 'Not Available',
                'Operator': limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : 'Not Available',
                'Amount': limitData.order.amountInINR ? parseFloat(limitData.order.amountInINR).toFixed(2) + ' INR' : '0.00',
                'Payment Mode': limitData.order.paymentMode ? limitData.order.paymentMode : 'Not Available',
                'Status': limitData.order.status ? limitData.order.status : 'Not Available',
            })
        })
        return finalData
}

const findPopularGiftCards = async (params) => {
    try {
        const ordersData = await order.findAll({
            include: [
                {
                    model: serviceOperator,
                    attributes: ["accessKey"],
                    where: {
                        accessKey: {
                            [Op.in]: params,
                        },
                    },
                },
            ],
            attributes: ["status", "orderResponse"],
            where: {
                status: "SUCCESS",
                orderResponse: {
                    [Op.not]: null,
                },
            },
        });
        const giftCardCount = {};

        ordersData.forEach((order) => {
            const orderResponse = JSON.parse(order.orderResponse);
            const giftCardId = orderResponse.body.giftCardId;
            giftCardCount[giftCardId] = (giftCardCount[giftCardId] || 0) + 1;
        });

        const topEightGiftCardIds = Object.keys(giftCardCount)
            .sort((a, b) => giftCardCount[b] - giftCardCount[a])
            .slice(0, 9);

        return topEightGiftCardIds;
    } catch (error) {
        console.log(error);
    } finally {
        console.log("FIND POPULAR GIFTCARDS ROUTE CALLED");
    }
};

const findOneByProviderId = async (params) => {
    try {
        return await order.findOne({
            where: {
                providerId: params.providerId
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("ORDER FIND BY PROVIDER ID ONE ROUTE CALLED")
    }
}

const findPopularProduct = async (params) => {
    try {
        console.log(params)
        //params = [params];
        const ordersData = await order.findAll({
            include: [
                {
                    model: serviceOperator,
                    attributes: ["accessKey"],
                    where: {
                        accessKey: params,
                    },
                },
            ],
            attributes: ["status", "orderResponse"],
            where: {
                status: "SUCCESS",
                orderResponse: {
                    [Op.not]: null,
                },
            },
        });
        const productQuantities = {}; // Object to store total quantities per productId

        ordersData.forEach((order) => {
            const orderResponse = JSON.parse(order.orderResponse);
            const products = orderResponse.products;

            products.forEach((product) => {
                const { productId, productQuantity } = product;

                if (productQuantities[productId]) {
                    productQuantities[productId] += productQuantity;
                } else {
                    productQuantities[productId] = productQuantity;
                }
            });
        });

        const topEightProductIds = Object.keys(productQuantities)
            .sort((a, b) => productQuantities[b] - productQuantities[a])
            .slice(0, 8);

        return topEightProductIds

    } catch (error) {
        console.log(error);
    } finally {
        console.log("FIND POPULAR GIFTCARDS ROUTE CALLED");
    }
};

const findOneOrderById = async (id) => {
    try {
        return await order.findOne({
            where: {
                id,
            },
        });
    } catch (error) {
        console.log(error);
    } finally {
        console.log("ORDER FIND ONE ROUTE CALLED");
    }
};

module.exports = {
    createOrder,
    findOneOrder,
    findAllOrder,
    updateOrder,
    deleteOrder,
    getExcel,
    findPopularGiftCards,
    findOneByProviderId,
    findPopularProduct,
    findOneOrderById
}