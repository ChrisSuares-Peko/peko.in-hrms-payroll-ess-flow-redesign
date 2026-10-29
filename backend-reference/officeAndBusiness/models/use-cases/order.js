const { handleSortFields } = require("../../utils/sortHandle");
const serviceOperators = require("../entities/serviceOperator");
const transaction = require("../entities/transaction");
const orders = require("./../entities/order");
const order = require("./../entities/order");
const { Op, fn, col, where: seqWhere } = require("sequelize");
const operatorsData = require("../../utils/operatorsData.json");

const DOMAIN_HOSTING_ACCESS_KEY = operatorsData["domainAndHosting"]["accessKey"];


const findOneOrder = async (params) => {
  try {
    return await order.findOne({
      where: {
        corporateTxnId: params.corporateTxnId,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND ONE ROUTE CALLED");
  }
};
const findOneOrderbyProviderId = async (params) => {
  try {
    return await order.findOne({
      where: {
        providerId: params.ref_id,
      },
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("ORDER FIND ONE ROUTE CALLED");
  }
};

const updateOrder = async (params, data) => {
  try {
    const where = {};
    if (params.id != null) where.id = params.id;
    if (params.corporateTxnId != null) where.corporateTxnId = params.corporateTxnId;
    return await order.update(data, { where });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("Update route called");
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

const findAllTransactions = async (params) => {
  try{
    let {
        from, 
        to, 
        categoryName, 
        searchText,
        sort,
        accessKey,
        limit = 5,
        offset,
        corporateId,
        serviceAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        registeredBy,
        subCorporateUserId,
        cashbackFilter,
        subPartnerId,
        status,
        accountNos
    } = params
  
    let order = handleSortFields(sortField,sort)
  
    // Adjust 'to' date to end of day
    const tomorrow = new Date(to);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
  
    let whereClause = {
        transactionDate: {
            [Op.between]: [from, tomorrow]
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
        },
        // {
        //     remarks: {
        //         [Op.like]: '%' + searchText + '%'
        //     }
        // },
         {
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
          '$order.accountNo$': {
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
        },{
          '$credential.username$': {
              [Op.like]: '%' + searchText + '%'
          }
      }]
    }

    if (corporateId) {
        whereClause.credentialId = corporateId
    }

    let whereClauseCredential = {}
    if (registeredBy) {
      whereClauseCredential.registeredBy = registeredBy,
      whereClauseCredential.subPartnerId = subPartnerId
    }
    
    if (subCorporateUserId) {
      whereClause['$order.subCorporateUserId$'] = subCorporateUserId;
    }
  
    if (cashbackFilter) {
      whereClause.corporateCashback = { [Op.gt]: 0 }; 
    }
    const normalizedAccountNos = Array.isArray(accountNos)
      ? accountNos.map((accountNo) => String(accountNo || "").trim().toLowerCase()).filter(Boolean)
      : [];

    let includeOptions = [
      {
        model: serviceOperators,
        where: {
            accessKey: accessKey,
        },
        attributes:serviceAttribute,
      },
    
    {
        model: orders,
        where: normalizedAccountNos.length
          ? seqWhere(fn("LOWER", col("order.accountNo")), { [Op.in]: normalizedAccountNos })
          : undefined,
        required: normalizedAccountNos.length ? true : false,
        // where:{
        //     status:filter
        // },
        attributes:orderAttribute,
        
    }
    ];
  
    if (categoryName && categoryName != 'all') {
        includeOptions[0].where.serviceCategory = categoryName;
    } else {
        delete includeOptions[0].where.serviceCategory;
    }

    // if(searchText){
    //   delete whereClause.transactionDate
    //   delete includeOptions[0].where.serviceCategory;
    // }
  
    const transactionWhere = {};
    if (status) {
      transactionWhere.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }
    if (corporateId) {
      transactionWhere.credentialId = corporateId;
    }
    if (subCorporateUserId) {
      transactionWhere['$order.subCorporateUserId$'] = subCorporateUserId;
    }

    return await transaction.findAll({
        include: includeOptions,
        where: Object.keys(transactionWhere).length ? transactionWhere : undefined,
        // where: whereClause,
        order: order,
        limit: limit,
        offset: offset,
        attributes:transactionAttribute,
        raw: true,
        nest: true
    });
  } catch (error) {
    console.log(error);
    throw  {message:'Something went wrong'};
  }
}

const findDomainHostingOrders = async ({ credentialId, searchText = '', from, to, limit = 10, offset = 0 }) => {
    const where = { credentialId };

    if (from && to) {
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        toDate.setHours(0, 0, 0, 0);
        where.transactionDate = { [Op.between]: [from, toDate] };
    }

    if (searchText) {
        where[Op.or] = [
            { corporateTxnId: { [Op.like]: `%${searchText}%` } },
            { orderResponse: { [Op.like]: `%${searchText}%` } },
            seqWhere(fn('DATE_FORMAT', col('transactionDate'), '%d %b %Y'), { [Op.like]: `%${searchText}%` }),
        ];
    }

    console.log('[findDomainHostingOrders] where:', JSON.stringify(where), 'limit:', limit, 'offset:', offset);

    const result = await orders.findAndCountAll({
        where,
        include: [{
            model: serviceOperators,
            where: { accessKey: DOMAIN_HOSTING_ACCESS_KEY },
            attributes: ['id', 'serviceProvider'],
        }],
        attributes: ['id', 'corporateTxnId', 'transactionDate', 'amountInINR', 'surcharge', 'status', 'paymentMode', 'providerId', 'orderResponse'],
        order: [['transactionDate', 'DESC']],
        limit,
        offset,
        raw: true,
        nest: true,
    });

    console.log('[findDomainHostingOrders] count:', result.count, 'rows:', result.rows.length);
    return result;
};

// Writes invoice/receipt payloads (e.g. pekoInvoiceDetails) onto an order row.
// Mirrors payment MS's use-case of the same name; must never throw — a failure
// here must not fail the payment flow.
const updateOrderInvoiceDetails = async ({ id, data }) => {
  try {
    return await order.update(data, {
      where: { id },
    });
  } catch (error) {
    console.log("Error while updating order invoice details:", error?.message);
    return null;
  } finally {
    console.log("ORDER INVOICE DETAILS UPDATE CALLED");
  }
};

const findDomainHostingOrderByTxnId = async ({ credentialId, corporateTxnId }) => {
    return await orders.findOne({
        where: { corporateTxnId, credentialId },
        include: [{
            model: serviceOperators,
            where: { accessKey: DOMAIN_HOSTING_ACCESS_KEY },
            attributes: [],
        }],
        attributes: ['id', 'corporateTxnId', 'transactionDate', 'amountInINR', 'surcharge', 'status', 'paymentMode', 'orderResponse'],
        raw: true,
        nest: true,
    });
};

module.exports = {
  findOneOrder,
  updateOrder,
  findOneOrderById,
  findOneOrderbyProviderId,
  findAllTransactions,
  findDomainHostingOrders,
  findDomainHostingOrderByTxnId,
  updateOrderInvoiceDetails,
};
