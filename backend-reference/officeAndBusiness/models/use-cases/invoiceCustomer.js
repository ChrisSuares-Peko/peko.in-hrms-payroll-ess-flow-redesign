const { Op } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const credential = require("../entities/credential");
const InvoiceCustomer = require("../entities/invoiceCustomer");
const invoiceCustomer = require("../entities/invoiceCustomer");

exports.createInvoiceCustomer = asyncHandler(async (data) => {

  const createdInvoiceCustomer = await InvoiceCustomer.create(data);
  return createdInvoiceCustomer || false;
});

exports.getInvoiceCustomerById = asyncHandler(async (params) => {
  let {

    from, 
    to, 
    searchText,
    sort,
    limit,
    offset,
    corporateId,
    // credentialAttribute,
    customerAttribute,
    sortField

} = params

  let whereClause = {
    [Op.or]: [{
      id: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      name: {
        [Op.like]: '%' + searchText + '%'
      }
    },
    {
      email: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      phoneNumber: {
        [Op.like]: '%' + searchText + '%'
      }
    },
    {
      address: {
        [Op.like]: '%' + searchText + '%'
      }
    }, {
      trnNo: {
        [Op.like]: '%' + searchText + '%'
      }
    }
   
    ]
  }
  if (from && to) {
    whereClause.createdAt = {
      [Op.between]: [from, to]
    }
  }
  if (corporateId) {
    whereClause.corporateUserId = corporateId
  }


 
  let sortClause

  if (sort) {
    sortClause = [sortField, sort]
  } else {
    sortClause = [sortField, 'DESC']
  }

  return await InvoiceCustomer.findAndCountAll({
    // include: includeOptions,
    where: whereClause,
    order: [
      sortClause
    ],
    limit: limit,
    offset: offset,
    attributes: customerAttribute,
    raw: true,
    nest: true
  });
})

exports.deleteInvoiceCustomer = asyncHandler(async (params) => {
  const where = { id: params.id };
  if (params.corporateUserId) where.corporateUserId = params.corporateUserId;
  const invoiceCustomer = await InvoiceCustomer.findOne({ where });
  if (!invoiceCustomer) {
    throw new Error('Invoice customer not found');
  }
  await invoiceCustomer.destroy({
    where: {
        id: params.id
    }
})
  return true;
});

exports.getAllInvoiceCustomersByUserId = asyncHandler(async (params) => {
  const where = { id: params.id };
  if (params.corporateUserId) where.corporateUserId = params.corporateUserId;
  const invoiceCustomers = await InvoiceCustomer.findOne({
    where,
    include:[{
      model:credential,
      attributes:['name' , 'username']
    }]
  });
  return invoiceCustomers || [];
});

exports.updateInvoiceCustomer = asyncHandler(async (data, params) => {
  const where = { id: params.id };
  if (params.corporateUserId) where.corporateUserId = params.corporateUserId;
  const responseData = await invoiceCustomer.update(data, { where });
  if (!responseData) {
    return false;
  }
  return responseData;
});

exports.fetchAllCustomers = asyncHandler(async (query, corporateId) => {
 

  return await InvoiceCustomer.findAll({
    where: {
      corporateUserId:corporateId,
      name: {
        [Op.like]: "%" + query + "%",
      }
    },
    // include: includeOptions,
     order:[['name' , 'ASC']],
    raw: true,
    nest: true,
  });
});

exports.checkEmailExist = asyncHandler(async (email, corporateUserId, id = undefined) => {
let whereClause = {
  email,
  corporateUserId
}
if(id){
  whereClause.id = { [Op.ne]: id }
}
  const existingCustomer = await invoiceCustomer.findOne({
    where: whereClause
  });
  return existingCustomer
})