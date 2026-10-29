const transaction = require('./../entities/transaction')
const orders = require('./../entities/order')
const serviceOperator = require('./../entities/serviceOperator')
const credential = require('./../entities/credential')
const UserCoupons = require('./../entities/userCoupons')
const sequelize = require('sequelize')
const moment = require('moment')
const {
    Op
} = require("sequelize");
const asyncHandler = require('./../../middlewares/async')
// F-PAY-30: sequelizeConfig only used by the commented-out dead raw-SQL fns.
// let sequelizeConfig = require('../../configs/database/index');
const { handleSortFields } = require('../../utils/sortHandle');
const createTransaction = async (params) => {
    try {
        return await transaction.create(params)
    } catch (error) {
        console.log(error.message)
    } finally {
        console.log("TRANSACTION CREATE ROUTE CALLED")
    }
}
const findTransactionsById = asyncHandler(async (corporateTxnId) => {

    let transactions = await transaction.findOne({
      where: {
        corporateTxnId: corporateTxnId
      },
      include: [
        { model: orders },
        { model: serviceOperator },
        {
          model: credential,
          attributes:["id","role","username","name","email"],
          required: true,
        },
      ],
      raw: true,
      nest: true,
    })
    return transactions
  });
const findAllRefundTransactions = asyncHandler(async (params) => {
    let { limit, offset, serviceAccessKey, corporateId, fromStart, endDate, searchText, partnerId, sort, sortField } = params;
    let order = handleSortFields(sortField, sort);

    if (serviceAccessKey === 'all') serviceAccessKey = undefined;

    const tomorrow = new Date(endDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    searchText = searchText?.trim();

    let whereClause = {
        transactionDate: {
            [Op.between]: [fromStart, tomorrow],
        },
        [Op.and]: [
            {
                [Op.or]: [
                    { corporateTxnId: { [Op.like]: `%${searchText}%` } },
                    { "$credential.username$": { [Op.like]: `%${searchText}%` } },
                    { "$credential.name$": { [Op.like]: `%${searchText}%` } },
                ],
            },
            {
                [Op.or]: [
                    { batchId: null },
                    { remarks: { [Op.ne]: "REFUND" } },
                    {
                        batchId: {
                            [Op.notIn]: sequelize.literal(`(
                                SELECT t.batchId
                                FROM transactions t
                                WHERE t.batchId IS NOT NULL
                                GROUP BY t.batchId
                                HAVING COUNT(*) > 1
                            )`),
                        },
                    },
                ],
            },
        ],
    };

    if (corporateId) whereClause.credentialId = corporateId;

    let registeredByClause = {};
    if (partnerId === 'default') {
        whereClause["$credential.registeredBy$"] = null;
    } else if (partnerId && partnerId !== "all") {
        whereClause["$credential.registeredBy$"] = Number(partnerId);
    }

    const includeOptions = [
        {
            model: serviceOperator,
            attributes: ["serviceProvider", "serviceCategory"],
            where: {},
            required: true,
        },
        {
            model: credential,
            attributes: ["id", "role", "username", "name", "registeredBy"],
            where: registeredByClause,
            required: true,
            include: [
                {
                    model: credential,
                    as: 'registeredByCredential',
                    attributes: ['name'],
                },
            ],
        },
        {
            model: orders,
            attributes: ["id", "paymentMode", "amountInINR", "paymentModeResponse"],
            include: [{ model: UserCoupons, as: 'couponData', attributes: ['usedCouponData'] }],
            required: true,
        },
    ];

    if (serviceAccessKey !== undefined) {
        includeOptions[0].where.accessKey = serviceAccessKey;
    } else {
        delete includeOptions[0].where.accessKey;
    }

    return await transaction.findAndCountAll({
        attributes: ["id", "corporateTxnId", "debitAmount", "transactionDate", "remarks", "status", "orderId", "refundedAmount"],
        include: includeOptions,
        where: whereClause,
        limit,
        offset,
        order,
        raw: true,
        nest: true,
    });
});
  

const findOneTransaction = async (params) => {
    try {
        console.log(params.corporateTxnId);
        return await transaction.findOne({
            where: {
                corporateTxnId: params.corporateTxnId,
            },
            include: [
                {
                    model: credential,
                    required: false,
                },
                {
                    model: orders,
                    required: false,
                },
            ],
        });
    } catch (error) {
        console.log(error);
    } finally {
        console.log("TRANSACTION FIND ONE ROUTE CALLED");
    }
};

const getOneTransaction = async (params) => {
    try {
        return await transaction.findOne({
            include: [
                {
                    model: orders,
                },
                {
                    model: serviceOperator,
                    attributes: ['serviceProvider']
                }
            ],
            where: {
                corporateTxnId: params.transactionId

            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("TRANSACTION FIND ONE ROUTE CALLED")
    }
}

const findAllTransaction = async (params) => {
    try {
        return await transaction.findAll({
            where: {
                credentialId: params.corporateId
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("TRANSACTION FIND ALL ROUTE CALLED")
    }
}

const updateTransaction = async (params) => {
    try {
        return await transaction.update({
            where: {
                tranId: params.tranId
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("TRANSACTION FIND ALL ROUTE CALLED")
    }
}

const deleteTransaction = async (params) => {
    try {
        return await transaction.destroy({
            where: {
                tranId: params.tranId
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("TRANSACTION DELETE ROUTE CALLED")
    }
}

const findAllTransactions = asyncHandler(async (params) => {
    let {
      from,
      to,
      categoryName,
      searchText,
      sort,
      filter,
      limit,
      offset,
      corporateId,
      serviceAttribute,
      credentialAttribute,
      transactionAttribute,
      orderAttribute,
      sortField,
      subCorporateUserId,
      productId
    } = params;
  
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
  
    let whereClause = {
      [Op.or]: [
        {
          id: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          corporateTxnId: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          debitAmount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          creditAmount: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          corporateCashback: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          systemCashback: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          balance: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          remarks: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$serviceOperator.serviceProvider$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          transactionCategory: {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$order.paymentMode$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$order.status$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$order.id$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
        {
          "$credential.name$": {
            [Op.like]: "%" + searchText + "%",
          },
        },
  
        sequelize.literal(`LOWER(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$')) LIKE LOWER(:searchText)`),
      ],
    };
    if (from && to) {
      whereClause.transactionDate = {
        [Op.between]: [from, tomorrow],
      };
    }
    if (corporateId) {
      whereClause.credentialId = corporateId;
    }
    if (subCorporateUserId) {
      whereClause["$order.subCorporateUserId$"] = subCorporateUserId;
    }
  
    let includeOptions = [
      {
        model: serviceOperator,
        where: {
          serviceProvider: categoryName,
        },
        attributes: serviceAttribute,
      },
      {
        model: credential,
        attributes: credentialAttribute,
      },
      {
        model: orders,
        where: {
          status: filter,
          orderResponse: {
            [sequelize.Op.ne]: null, // Using Sequelize's not equal operator
          },
          ...(productId && {
            [Op.and]: [
              sequelize.literal(
                `CAST(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$.emailDomainsDetails.softwaresSubscriptionId') AS UNSIGNED) = ${Number(productId)}`
              ),
            ],
          }),
        },
        attributes: orderAttribute,
      },
    ];
    let sortClause;
  
    if (sort) {
      sortClause = [sortField, sort];
    } else {
      sortClause = [sortField, "ASC"];
    }
  
    if (filter) {
      includeOptions[2].where.status = filter;
    } else {
      delete includeOptions[2].where.status;
    }
  
    if (categoryName && categoryName != "all") {
      includeOptions[0].where.serviceProvider = categoryName;
    } else {
      delete includeOptions[0].where.serviceProvider;
    }
  
    const replacements = {
      searchText: `%${searchText}%`,
    };
  
    return await transaction.findAndCountAll({
      include: includeOptions,
      where: whereClause,
      order: [sortClause],
      limit: limit,
      offset: offset,
      attributes: transactionAttribute,
      replacements: replacements,
      raw: true,
      nest: true,
    });
  });

const findAllBbpsTransactions = asyncHandler(async (params) => {
    let {
        from,
        to,
        bbpsAccessKeys,
        searchText,
        sort,
        filter,
        limit,
        offset,
        corporateId,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        subCorporateUserId,
        productId,
    } = params;

    const whereClause = {};

    if (searchText) {
        whereClause[Op.or] = [
            { id: { [Op.like]: `%${searchText}%` } },
            { corporateTxnId: { [Op.like]: `%${searchText}%` } },
            { debitAmount: { [Op.like]: `%${searchText}%` } },
            { creditAmount: { [Op.like]: `%${searchText}%` } },
            { corporateCashback: { [Op.like]: `%${searchText}%` } },
            { systemCashback: { [Op.like]: `%${searchText}%` } },
            { balance: { [Op.like]: `%${searchText}%` } },
            { remarks: { [Op.like]: `%${searchText}%` } },
            { "$serviceOperator.serviceProvider$": { [Op.like]: `%${searchText}%` } },
            { transactionCategory: { [Op.like]: `%${searchText}%` } },
            { "$order.paymentMode$": { [Op.like]: `%${searchText}%` } },
            { "$order.status$": { [Op.like]: `%${searchText}%` } },
            { "$order.id$": { [Op.like]: `%${searchText}%` } },
            { "$credential.name$": { [Op.like]: `%${searchText}%` } },
            sequelize.literal(
                `LOWER(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$')) LIKE LOWER(:searchText)`
            ),
        ];
    }

    if (from && to) {
        const tomorrow = new Date(to);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);

        whereClause.transactionDate = { [Op.between]: [from, tomorrow] };
    }

    if (corporateId) {
        whereClause.credentialId = corporateId;
    }

    if (subCorporateUserId) {
        whereClause["$order.subCorporateUserId$"] = subCorporateUserId;
    }

    let includeOptions = [
        {
            model: serviceOperator,
            attributes: ["serviceProvider"],
            where: bbpsAccessKeys && bbpsAccessKeys.length > 0
                ? { accessKey: { [Op.in]: bbpsAccessKeys } }
                : undefined,
        },
        {
            model: credential,
            attributes: credentialAttribute,
        },
        {
            model: orders,
            where: {
                orderResponse: { [sequelize.Op.ne]: null },
                ...(filter && { status: filter }),
                ...(productId && {
                    [Op.and]: [
                        sequelize.literal(
                            `CAST(JSON_EXTRACT(\`order\`.\`orderResponse\`, '$.emailDomainsDetails.softwaresSubscriptionId') AS UNSIGNED) = ${Number(
                                productId
                            )}`
                        ),
                    ],
                }),
            },
            attributes: orderAttribute,
        },
    ];

    const sortClause = [sortField || "transactionDate", sort || "DESC"];

    const queryOptions = {
        include: includeOptions,
        where: whereClause,
        order: [sortClause],
        attributes: transactionAttribute,
        raw: true,
        nest: true,
    };

    if (limit) queryOptions.limit = limit;
    if (offset !== undefined) queryOptions.offset = offset;

    if (searchText) {
        queryOptions.replacements = { searchText: `%${searchText}%` };
    }

    return await transaction.findAndCountAll(queryOptions);
});




const findAllPartnerTransactions = asyncHandler(async (params) => {
    let {
        corporateId,
        partnerId,
        from,
        to,
        start,
        length,
        searchText,
        order,
        column,
        details,
        categoryName
    } = params
    console.log(partnerId)
    const sortableColumns = [
        'transactionDate',
        'providerId',
        'corporateTxnId',
        'transactionCategory',
        'serviceOperator.serviceProvider',
        'amountInINR',
        'order.paymentMode ',
        'order.status',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }

    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to]
        },
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            corporateTxnId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            debitAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            creditAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            systemCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            balance: {
                [Op.like]: '%' + searchText + '%'
            },
        }, {
            remarks: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            '$serviceOperator.serviceProvider$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            transactionCategory: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            '$order.paymentMode$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            '$order.status$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            '$credential.name$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        ]
    }
    if (corporateId) {
        whereClause.credentialId = corporateId
    }
    let includeOptions = [{
        model: serviceOperator,
        where: {
            serviceCategory: categoryName,
            // [Op.or]: [{
            //     serviceProvider: {
            //         [Op.like]: '%' + searchText + '%'
            //     }
            // }]
        },
        required: details || false,
    },
    {
        model: credential,
        where: {
            registeredBy: partnerId
        },
        attributes: ['name', 'id']
        // required: details || false,

    },
    {
        model: orders,
        required: details || false,

    }
    ];
    if (categoryName !== undefined) {
        includeOptions[0].where.serviceCategory = categoryName;
    } else {
        delete includeOptions[0].where.serviceCategory;
    }
    return await transaction.findAndCountAll({
        include: includeOptions,
        where: whereClause,
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true
    });
    // return await transaction.findAndCountAll({
    //     include: [{
    //         model: serviceOperator,
    //         where: {
    //             serviceCategory: categoryName,
    //             [Op.or]: [{
    //                 serviceProvider: {
    //                     [Op.like]: '%' + searchText + '%'
    //                 }
    //             }]
    //         },
    //         required: details || false,

    //     },
    //     {
    //         model: credential,
    //         where: {
    //             [Op.or]: [{
    //                 name: {
    //                     [Op.like]: '%' + searchText + '%'
    //                 }
    //             }]
    //         },
    //         required: details || false,

    //     },
    //     {
    //         model: orders,
    //         required: details || false,

    //     }
    //     ],
    //     where: whereClause,
    //     order: [
    //         [column, order]
    //     ],
    //     limit: length,
    //     offset: start,
    //     raw: true,
    //     nest: true
    // })
})
const findAllVendorTransactions = asyncHandler(async (params) => {
    let {
        vendorId,
        from,
        to,
        start,
        length,
        searchText,
        order,
        column,
        details
    } = params
    details = true
    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to]
        },
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            corporateTxnId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            debitAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            creditAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            systemCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            balance: {
                [Op.like]: '%' + searchText + '%'
            },
        }, {
            remarks: {
                [Op.like]: '%' + searchText + '%'
            }

        }
        ]
    }
    let vendorWhereClause = {}
    if (vendorId) {
        vendorWhereClause = {
            vendorId,
            [Op.or]: [{
                serviceProvider: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        }
    } else {
        vendorWhereClause = {
            [Op.or]: [{
                serviceProvider: {
                    [Op.like]: '%' + searchText + '%'
                }
            }]
        }
    }
    return await transaction.findAndCountAll({
        include: [{
            model: serviceOperator,
            where: vendorWhereClause,
            required: details || false,

        },
        {
            model: credential,
            where: {
                [Op.or]: [{
                    name: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }]
            },
            required: details || false,

        },
        {
            model: orders,
            required: details || false,

        }
        ],
        where: whereClause,
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true
    })
})
const transactionDetails = async (params) => {
    console.log(params)
    try {
        return await orders.findOne({
            include: [{
                model: serviceOperator,
                as: '',
                attributes: ['serviceProvider']
            }],
            where: {
                corporateTxnId: params.transactionId
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("ORDER FIND ONE ROUTE CALLED")
    }
}
/* F-PAY-30: dead raw-SQL fn (no app callers, test-only) — latent SQLi; commented out, not removed.
const transactionReports = async (params) => {
    try {
        let {
            credentialId,
            from,
            to
        } = params
        return sequelizeConfig.query(`select * from reportAll 
     where reportAll.credentialId = ${credentialId} and reportAll.transactionDate BETWEEN ? AND ?`, {
            replacements: [from, to],
            type: sequelizeConfig.QueryTypes.SELECT
        });
    } catch (error) {
        return []
    }
}
*/
const transactionExcelCSV = async (params) => {
    try {
        let {
            from,
            to,
            order,
            column
        } = params
        let whereClause = {
            transactionDate: {
                [Op.between]: [from, to]
            }
        }

        let data = await transaction.findAndCountAll({
            include: [{
                model: serviceOperator,
                required: false,

            },
            {
                model: credential,
                required: false,

            },
            {
                model: orders,
                required: false,

            }
            ],
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
                'Transaction Id': limitData.corporateTxnId ? (limitData.corporateTxnId).toString() : 'Not Available',
                'Corporate Name': limitData.credential.name ? limitData.credential.name : 'Not Available',
                'Date': limitData.transactionDate ? moment(limitData.transactionDate).format('YYYY-MM-DD HH:mm:ss') : 'Not Available',
                'Type': limitData.transactionType ? limitData.transactionType : 'Not Available',
                'Category': limitData.transactionCategory ? limitData.transactionCategory : 'Not Available',
                'Debit Amount': limitData.debitAmount ? limitData.debitAmount + '₹' : '0.0000',
                'Credit Amount': limitData.creditAmount ? limitData.creditAmount + '₹' : '0.0000',
                'Cashback': limitData.corporateCashback ? limitData.corporateCashback + '₹' : '0.0000',
                'Balance': limitData.balance ? limitData.balance + '₹' : '0.0000',
                'Remarks': limitData.remarks ? limitData.remarks : 'Not Available',
            })
        })
        return finalData
    } catch (error) {
        return []
    }
}
const walletExcelCSV = async (params) => {
    try {
        let {
            from,
            to
        } = params
        let whereClause = {
            transactionDate: {
                [Op.between]: [from, to]
            },
            transactionCategory: 'FUND TRANSFER',
        }
        const data = await transaction.findAndCountAll({
            include: [{
                model: credential,
                where: {
                    role: 'CORPORATE'
                },
                attributes: ['name']
            }],
            where: whereClause,
            order: [
                ['createdAt', 'DESC']
            ],
            raw: true,
            nest: true
        })

        let finalData = []
        data.rows.forEach(function (limitData) {
            finalData.push({
                'ID': limitData.id,
                'Transaction Id': limitData.corporateTxnId ? limitData.corporateTxnId : 'Not Available',
                'Transaction Date': limitData.transactionDate ? moment(limitData.transactionDate).format('YYYY-MM-DD HH:mm:ss') : 'Not Available',
                'Transaction Type': limitData.transactionType ? limitData.transactionType : 'Not Available',
                'Debit Amount': limitData.debitAmount ? limitData.debitAmount + "₹" : '0.0000',
                'Credit Amount': limitData.creditAmount ? limitData.creditAmount + "₹" : '0.0000',
                'Balance': limitData.balance ? limitData.balance + "₹" : '0.0000',
                'Remarks': limitData.remarks ? limitData.remarks : 'Not Available'
            })
        })
        return finalData
    } catch (error) {
        return []
    }
}

const findAllWalletTransactions = asyncHandler(async (params) => {
    let {
        start,
        from,
        to,
        length,
        searchText,
        order,
        column,
        userId
    } = params
    const sortableColumns = [
        'corporateTxnId',
        'transactionDate',
        'serviceOperator.serviceProvider',
        'transactionType',
        'transactionCategory',
        'debitAmount',
        'creditAmount',
        'corporateCashback ',
        'balance',
        'remarks',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }

    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to]
        },
        transactionCategory: 'FUND TRANSFER',
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateTxnId: {
                [Op.like]: '%' + searchText + '%'
            }
        },

        {
            debitAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            creditAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            systemCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            balance: {
                [Op.like]: '%' + searchText + '%'
            },
        },
        {
            remarks: {
                [Op.like]: '%' + searchText + '%'
            }

        }, {
            '$credential.name$': {
                [Op.like]: '%' + searchText + '%'
            }
        }
        ]
    }
    if (userId) {
        whereClause['credentialId'] = userId
    }
    return await transaction.findAndCountAll({
        include: [{
            model: credential,
            where: {
                // [Op.or]: [{
                //     name: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // }],
                role: 'CORPORATE'
            },
            attributes: ['name']
        }],
        where: whereClause,
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true
    })
})

/* F-PAY-30: dead raw-SQL fn (no app callers, test-only) — latent SQLi; commented out, not removed.
const findAllInvestmentsAndCount = asyncHandler(async (params) => {
    let {
        corporateId,
        from,
        to,
        start,
        length,
        searchText,
        order,
        column,
    } = params
    const sortableColumns = [
        'id',
        'createdAt',
        'operatorId',
        'investmentData.name',
        'amount',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to]
        },
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            corporateTxnId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            debitAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            creditAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            systemCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            balance: {
                [Op.like]: '%' + searchText + '%'
            },
        }, {
            remarks: {
                [Op.like]: '%' + searchText + '%'
            }

        }
        ]
    }
    if (corporateId) {
        whereClause.credentialId = corporateId
    }
    return await orders.findAndCountAll({
        include: [{
            model: serviceOperator,
            where: {
                serviceCategory: 'zeroCarbon', //filter only those who belongs to serviceCategory workspace
            },
        }],
        where: {
            credentialId: corporateId, //filter only those who belongs to specific user
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                },
            }, {
                operatorId: {
                    [Op.like]: '%' + searchText + '%'
                },
            }, {
                amountInINR: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                orderResponse: {
                    [Op.like]: '%' + searchText + '%',
                },
            },
            sequelize.literal(`orderResponse -> '$.investData.name' LIKE '%${searchText}%'`),
            ]
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
*/
const findAllWorkspaceOrders = asyncHandler(async (params) => {
    let {
        start,
        from,
        to,
        length,
        searchText,
        order,
        column
    } = params
    const sortableColumns = [
        'corporateTxnId',
        'credential.name',
        'planDetails.name',
        'transactionDate',
        'amountInINR',
        'paymentMode',
        'status',
        'bookingDetails.name',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    return await orders.findAndCountAll({
        include: [{
            model: serviceOperator,
            where: {
                serviceCategory: 'Workspaces', //filter only those who belongs to serviceCategory workspace
                //  [Op.or]: [{
                // serviceProvider: {
                // [Op.like]: '%' + searchText + '%'
                // }
                //}]
            }
        },
        {
            model: credential,
            attributes: ["name"]
        }
        ],
        where: {
            transactionDate: {
                [Op.between]: [from, to]
            },
            [Op.or]: [{
                id: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                corporateTxnId: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                operatorId: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                amountInINR: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                baseAmount: {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                baseCurrency: {
                    [Op.like]: '%' + searchText + '%'
                },
            },
            {
                exchangeRate: {
                    [Op.like]: '%' + searchText + '%'
                }

            },
            {
                status: {
                    [Op.like]: '%' + searchText + '%'
                }

            },
            {
                paymentMode: {
                    [Op.like]: '%' + searchText + '%'
                }

            },
            {
                '$credential.name$': {
                    [Op.like]: '%' + searchText + '%'
                }
            },
            {
                message: {
                    [Op.like]: '%' + searchText + '%'
                }

            },
            ]
        },
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true,
    })
})
const findAllPartnerWorkspaceOrders = asyncHandler(async (params) => {
    let {
        corporateId,
        start,
        from,
        to,
        length,
        searchText,
        order,
        column,
        partnerId
    } = params
    const sortableColumns = [
        'corporateTxnId',
        'credential.name',
        'planDetails.name',
        'transactionDate',
        'amountInINR',
        'paymentMode',
        'status',
        'bookingDetails.name',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to]
        },
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateTxnId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            operatorId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            amountInINR: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            baseAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            baseCurrency: {
                [Op.like]: '%' + searchText + '%'
            },
        },
        {
            exchangeRate: {
                [Op.like]: '%' + searchText + '%'
            }

        },
        {
            status: {
                [Op.like]: '%' + searchText + '%'
            }

        },
        {
            paymentMode: {
                [Op.like]: '%' + searchText + '%'
            }

        },
        {
            '$credential.name$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            message: {
                [Op.like]: '%' + searchText + '%'
            }

        },
        ]
    }
    if (corporateId) {
        whereClause.credentialId = corporateId
    }
    return await orders.findAndCountAll({
        include: [{
            model: serviceOperator,
            where: {
                serviceCategory: 'Workspaces', //filter only those who belongs to serviceCategory workspace
                //  [Op.or]: [{
                // serviceProvider: {
                // [Op.like]: '%' + searchText + '%'
                // }
                //}]
            }
        },
        {
            model: credential,
            where: {
                registeredBy: partnerId
            },
            attributes: ["name"]
        }
        ],
        where: whereClause,
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true,
    })
})

const findAllOrdersCount = asyncHandler(async (params, statusAlt) => {
    let { start, from, to, length, searchText, order, column} = params;
    const sortableColumns = ["corporateTxnId", "credential.name", "productName", "transactionDate", "totalPrice ", "paymentMode", "status"];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
    } else {
        column = "updatedAt"; // Default column name if invalid index is provided
    }

    const whereConditions = {
        [Op.or]: [
            {
                id: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                corporateTxnId: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                operatorId: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                amountInINR: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                baseAmount: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                baseCurrency: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                exchangeRate: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                status: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                paymentMode: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                "$credential.name$": {
                    [Op.like]: "%" + searchText + "%",
                },
            },
            {
                message: {
                    [Op.like]: "%" + searchText + "%",
                },
            },
        ],
    };

    if (from && to) {
        whereConditions.transactionDate = {
            [Op.between]: [from, to],
        };
    }

    if (statusAlt) {
        whereConditions.workspaceOrderStatus = statusAlt;
    }

    return await orders.findAndCountAll({
        include: [
            {
                model: serviceOperator,
                where: {
                    serviceCategory: "Office Supplies", //filter only those who belongs to serviceCategory Office Supplies
                    // [Op.or]: [{
                    //     serviceProvider: {
                    //         [Op.like]: '%' + searchText + '%'
                    //     }
                    // }]
                },
            },
            {
                model: credential,
                attributes: ["name"],
            },
        ],
        where: whereConditions,
        order: [[column, order]],
        limit: length,
        offset: start,
        raw: true,
        nest: true,
    });
});
const findAllPartnerOrdersCount = asyncHandler(async (params) => {
    let {
        corporateId,
        start,
        from,
        to,
        length,
        searchText,
        order,
        column,
        partnerId
    } = params
    const sortableColumns = [
        'corporateTxnId',
        'credential.name',
        'productName',
        'transactionDate',
        'totalPrice ',
        'paymentMode',
        'status',
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
        console.log("column selected", column)
    } else {
        column = 'createdAt'; // Default column name if invalid index is provided
    }
    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to]
        },
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateTxnId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            operatorId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            amountInINR: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            baseAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            baseCurrency: {
                [Op.like]: '%' + searchText + '%'
            },
        },
        {
            exchangeRate: {
                [Op.like]: '%' + searchText + '%'
            }

        },
        {
            status: {
                [Op.like]: '%' + searchText + '%'
            }

        },
        {
            paymentMode: {
                [Op.like]: '%' + searchText + '%'
            }

        },
        {
            '$credential.name$': {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            message: {
                [Op.like]: '%' + searchText + '%'
            }

        },
        ]
    }
    if (corporateId) {
        whereClause.credentialId = corporateId
    }
    return await orders.findAndCountAll({
        include: [{
            model: serviceOperator,
            where: {
                serviceCategory: 'Office Supplies', //filter only those who belongs to serviceCategory Office Supplies
                // [Op.or]: [{
                //     serviceProvider: {
                //         [Op.like]: '%' + searchText + '%'
                //     }
                // }]
            }
        },
        {
            model: credential,
            where: {
                registeredBy: partnerId
            },
            attributes: ["name"]
        }
        ],
        where: whereClause,
        order: [
            [column, order]
        ],
        limit: length,
        offset: start,
        raw: true,
        nest: true,
    })
})
const getExcelCSVData = asyncHandler(async (params) => {
    let {
        corporateId,
        from,
        to,
        searchText,
        order,
        column,
        reportFor
    } = params
    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to]
        },
        [Op.or]: [{
            id: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            corporateTxnId: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            debitAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            creditAmount: {
                [Op.like]: '%' + searchText + '%'
            }
        },
        {
            corporateCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            systemCashback: {
                [Op.like]: '%' + searchText + '%'
            }
        }, {
            balance: {
                [Op.like]: '%' + searchText + '%'
            },
        }, {
            remarks: {
                [Op.like]: '%' + searchText + '%'
            }

        }
        ]
    }
    if (corporateId) {
        whereClause.credentialId = corporateId
    }
    let data = await transaction.findAndCountAll({
        include: [{
            model: serviceOperator,
            where: {
                [Op.or]: [{
                    serviceProvider: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }]
            },
            required: false,

        },
        {
            model: credential,
            where: {
                [Op.or]: [{
                    name: {
                        [Op.like]: '%' + searchText + '%'
                    }
                }]
            },
            required: false,

        },
        {
            model: orders,
            required: false,

        }
        ],
        where: whereClause,
        order: [
            [column, order]
        ],
        raw: true,
        nest: true
    })

    let finalData = []
    if (reportFor && reportFor == 'walletReports') {
        data.rows.forEach(function (limitData) {
            finalData.push({
                'ID': limitData.id,
                'Transaction ID': limitData.corporateTxnId ? limitData.corporateTxnId : 'Not Available',
                'Date': limitData.transactionDate ? moment(limitData.transactionDate).format('YYYY-MM-DD HH:mm:ss') : 'Not Available',
                'Transaction Type': limitData.transactionType ? limitData.transactionType : 'Not Available',
                'Category': limitData.transactionCategory ? limitData.transactionCategory : 'Not Available',
                'Debit Amount': limitData.debitAmount ? limitData.debitAmount : '0.00',
                'Credit Amount': limitData.creditAmount ? limitData.creditAmount : '0.00',
                'Cashback': limitData.corporateCashback ? limitData.corporateCashback : '0.00',
                'Balance': limitData.balance ? limitData.balance : '0.00',
                'Remarks': limitData.remarks ? limitData.remarks : 'Not Available'
            })
        })
    } else {
        data.rows.forEach(function (limitData) {
            finalData.push({
                'ID': limitData.id,
                'Date/Time': limitData.transactionDate ? moment(limitData.transactionDate).format('YYYY-MM-DD HH:mm:ss') : 'Not Available',
                'Order ID': limitData.providerId ? limitData.providerId : 'Not Available',
                'Transaction ID': limitData.corporateTxnId ? limitData.corporateTxnId : 'Not Available',
                'Category': limitData.transactionCategory ? limitData.transactionCategory : 'Not Available',
                'Operator': limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : 'Not Available',
                'Amount': limitData.order.amountInINR ? parseFloat(limitData.order.amountInINR).toFixed(2) + ' ₹' : '0.00',
                'Payment Mode': limitData.order.paymentMode ? limitData.order.paymentMode : 'Not Available',
                'Status': limitData.status ? limitData.status : 'Not Available',
                //'Account No': limitData.order.accountNo ? limitData.order.accountNo : 'Not Available',
                //'Amount Paid via Wallet': limitData.debitAmount ? limitData.debitAmount : '0.00',
                //'Amount Paid via Dapi': limitData.order.paymentModeResponse == null ? '0.00' : JSON.parse(limitData.order.paymentModeResponse).dapiAmount
            })
        })
    }
    return finalData
})

const getDataExcelCSV = asyncHandler(async (params) => {
    let { corporateId, from, to, categoryName, details } = params;

    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to],
        },
    };

    if (corporateId) {
        whereClause.credentialId = corporateId;
    }

    let includeOptions = [
        {
            model: serviceOperator,
            required: details || false,
        },
        {
            model: credential,
            required: details || false,
        },
        {
            model: orders,
            required: details || false,
        },
    ];

    if (categoryName != "null") {
        whereClause.transactionCategory = categoryName;
    }

    let data = await transaction.findAndCountAll({
        include: includeOptions,
        where: whereClause,
        raw: true,
        nest: true,
    });

    let finalData = [];
    data.rows.forEach(function (limitData) {
        finalData.push({
            ID: limitData.id,
            "Date/Time": limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
            "Order ID": limitData.providerId ? limitData.providerId : "Not Available",
            "Transaction ID": limitData.corporateTxnId ? limitData.corporateTxnId : "Not Available",
            Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
            Operator: limitData.serviceOperator.serviceProvider ? limitData.serviceOperator.serviceProvider : "Not Available",
            Amount: limitData.order.amountInINR ? parseFloat(limitData.order.amountInINR).toFixed(2) + " ₹" : "0.00",
            "Payment Mode": limitData.order.paymentMode ? limitData.order.paymentMode : "Not Available",
            Status: limitData.status ? limitData.status : "Not Available",
            //'Account No': limitData.order.accountNo ? limitData.order.accountNo : 'Not Available',
            //'Amount Paid via Wallet': limitData.debitAmount ? limitData.debitAmount : '0.00',
            //'Amount Paid via Dapi': limitData.order.paymentModeResponse == null ? '0.00' : JSON.parse(limitData.order.paymentModeResponse).dapiAmount
        });
    });
    return finalData;
});

const vendorReportExcelCSV = async (params) => {
    try {
        let { vendorId, from, to } = params;
        let whereClause = {
            transactionDate: {
                [Op.between]: [from, to],
            },
        };
        let vendorWhereClause = {};
        if (vendorId) {
            vendorWhereClause = {
                vendorId,
            };
        } else {
            vendorWhereClause = {};
        }
        return await transaction.findAndCountAll({
            include: [
                {
                    model: serviceOperator,
                    where: vendorWhereClause,
                },
                {
                    model: credential,
                },
                {
                    model: orders,
                },
            ],
            where: whereClause,
            raw: true,
            nest: true,
        });
    } catch (error) {
        return [];
    }
};

const corporateAllTransactions = asyncHandler(async (params) => {
    let { corporateId, from, to } = params;

    let whereClause = {
        transactionDate: {
            [Op.between]: [from, to],
        },
    };
    if (corporateId) {
        whereClause.credentialId = corporateId;
    }
    let includeOptions = [
        {
            model: serviceOperator,
        },
        {
            model: credential,
        },
        {
            model: orders,
        },
    ];
    return await transaction.findAndCountAll({
        include: includeOptions,
        where: whereClause,
        raw: true,
        nest: true,
    });
});

const transactionExcelCSVOnFinance = async (params) => {
    try {
        let { from, to, order, column, partnerId, corporateId } = params;
        let whereClause = {
            transactionDate: {
                [Op.between]: [from, to],
            },
        };

        if (corporateId) {
            whereClause.credentialId = corporateId;
        }

        let data = await transaction.findAndCountAll({
            include: [
                {
                    model: serviceOperator,
                    required: false,
                },
                {
                    model: credential,
                    required: false,
                },
                {
                    model: orders,
                    required: false,
                },
            ],
            where: whereClause,
            order: [[column, order]],
            raw: true,
            nest: true,
        });
        let finalData = [];
        data.rows.forEach(function (limitData) {
            if (limitData.credential.registeredBy == partnerId) {
                finalData.push({
                    "Transaction Id": limitData.corporateTxnId ? limitData.corporateTxnId.toString() : "Not Available",
                    "Corporate Name": limitData.credential.name ? limitData.credential.name : "Not Available",
                    Date: limitData.transactionDate ? moment(limitData.transactionDate).format("YYYY-MM-DD HH:mm:ss") : "Not Available",
                    Type: limitData.transactionType ? limitData.transactionType : "Not Available",
                    Category: limitData.transactionCategory ? limitData.transactionCategory : "Not Available",
                    "Debit Amount": limitData.debitAmount ? limitData.debitAmount + "₹" : "0.0000",
                    "Credit Amount": limitData.creditAmount ? limitData.creditAmount + "₹" : "0.0000",
                    Cashback: limitData.corporateCashback ? limitData.corporateCashback + "₹" : "0.0000",
                    Balance: limitData.balance ? limitData.balance + "₹" : "0.0000",
                    Remarks: limitData.remarks ? limitData.remarks : "Not Available",
                });
            }
        });
        return finalData;
    } catch (error) {
        return [];
    }
};

const findLatestFiveOrders = asyncHandler(async (params) => {
    let { length, order, column, serviceCategory } = params;

    return await orders.findAndCountAll({
        include: [
            {
                model: serviceOperator,
                where: {
                    serviceCategory: serviceCategory, //filter only those who belongs to serviceCategory Office Supplies
                },
                attributes: ["serviceCategory"],
            },
            {
                model: credential,
                attributes: ["name"],
            },
        ],
        order: [[column, order]],
        limit: length,
        //offset: -1,
        raw: true,
        nest: true,
    });
});

const findStatusCountEcommerce = asyncHandler(async (params) => {
    let { serviceCategory } = params;
    const serviceOperatorRecord = await serviceOperator.findOne({
        where: { serviceCategory },
    });
    return await orders.findAll({
        attributes: ["ecomOrderStatus", [sequelize.fn("COUNT", "ecomOrderStatus"), "count"]],
        where: {
            serviceOperatorId: serviceOperatorRecord.id,
            // ecomOrderStatus: {
            //   [Op.in]: ["PENDING", "CONFIRMED", "ON PROGRESS", "SHIPPED", "COMPLETE", "CANCELLED"],
            // },
        },
        group: ["ecomOrderStatus"],
        raw: true,
    });
});

const updateTransactionById = async (transactionId, data) => {
    try {
        return await transaction.update(data, {
            where: {
                id: transactionId
            }
        })
    } catch (error) {
        console.log(error.message);
    } finally {
        console.log("TRANSACTION CREATE ROUTE CALLED");
    }
};

const findAllSubscriptionOrders = asyncHandler(async (params) => {
    let { start, from, to, length, searchText, order, column } = params;
    const sortableColumns = [
        "corporateTxnId",
        "credential.name",
        "planDetails.name",
        "transactionDate",
        "amountInINR",
        "paymentMode",
        "status",
        "bookingDetails.name",
    ];
    // Convert column index to column name
    if (column >= 0 && column < sortableColumns.length) {
        column = sortableColumns[column];
    } else {
        column = "createdAt"; // Default column name if invalid index is provided
    }
    return await orders.findAndCountAll({
        include: [
            {
                model: serviceOperator,
                where: {
                    serviceCategory: "Subscriptions", //filter only those who belongs to serviceCategory subscription
                    //  [Op.or]: [{
                    // serviceProvider: {
                    // [Op.like]: '%' + searchText + '%'
                    // }
                    //}]
                },
            },
            {
                model: credential,
                attributes: ["name", "email"],
            },
        ],
        where: {
            transactionDate: {
                [Op.between]: [from, to],
            },
            [Op.or]: [
                {
                    id: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    corporateTxnId: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    operatorId: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    amountInINR: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    baseAmount: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    baseCurrency: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    exchangeRate: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    status: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    paymentMode: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    "$credential.name$": {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
                {
                    message: {
                        [Op.like]: "%" + searchText + "%",
                    },
                },
            ],
        },
        order: [[column, order]],
        limit: length,
        offset: start,
        raw: true,
        nest: true,
    });
});

const findTransactionsByBatchId = async (batchId, credentialId, attributes=['status', 'corporateTxnId']) => {
    try {
      let transactions = await transaction.findAll({
        where: {
          batchId,
          credentialId
        },
        include: [
          { model: orders }
        ],
        attributes,
        raw: true,
        nest: true,
      })
      // Convert corporateTxnId to integer for UI type match
      transactions = transactions.map(transaction => ({
        ...transaction,
        corporateTxnId: parseInt(transaction.corporateTxnId)
      }));
      return transactions
    } catch (error) {
      console.log({ error })
      return []
    }
  }

module.exports = {
    createTransaction,
    findOneTransaction,
    findAllTransaction,
    updateTransaction,
    deleteTransaction,
    findAllTransactions,
    transactionExcelCSV,
    findAllVendorTransactions,
    findAllWalletTransactions,
    findAllOrdersCount,
    walletExcelCSV,
    transactionDetails,
    findAllPartnerTransactions,
    getExcelCSVData,
    findAllWorkspaceOrders,
    findAllPartnerWorkspaceOrders,
    findAllPartnerOrdersCount,
    getOneTransaction,
    getDataExcelCSV,
    vendorReportExcelCSV,
    corporateAllTransactions,
    transactionExcelCSVOnFinance,
    findLatestFiveOrders,
    findStatusCountEcommerce,
    updateTransactionById,
    findAllSubscriptionOrders,
    findTransactionsByBatchId,
    findAllRefundTransactions,
    findTransactionsById,
    findAllBbpsTransactions
}