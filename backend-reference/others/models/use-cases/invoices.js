const invoice = require('./../entities/invoices')
const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async')

exports.findAllInvoiceAndCount = asyncHandler(async (params) => {
    let {
        limit,
        offset,
        from,
        to,
        sort,
        searchText,
        column,
    } = params
   // Adjust 'to' date to end of day
   const tomorrow = new Date(to);
   tomorrow.setDate(tomorrow.getDate() + 1);
   tomorrow.setHours(0, 0, 0, 0);

    return await invoice.findAndCountAll({
        where: {
            createdAt: {
                [Op.between]: [from, tomorrow]
            },

            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                recipientDetails: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                invoiceDetails: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                productDetails: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                paymentDetails: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                comments: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                termsConditions: {
                    [Op.like]: '%' + searchText + '%'
                }
            }, {
                paymentMode: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        },
        order: [
            [column, sort]
        ],
        limit,
        offset,
        raw: true,
        nest: true
    })
})
