const asyncHandler = require("../../middlewares/async");
const { fetchAllCorporate } = require("../../models/use-cases/corporateUser");
const { createInvoiceCustomer, getInvoiceCustomerById, updateInvoiceCustomer, deleteInvoiceCustomer, getAllInvoiceCustomersByUserId, fetchAllCustomers, checkEmailExist } = require("../../models/use-cases/invoiceCustomer");

const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");


exports.createCustomer = asyncHandler(async (req, res, next) => {
  try {
    let data = req.body
    data = {corporateUserId:req.user.corporateId, ...data}
    const userExist = await checkEmailExist(data.email, data.corporateUserId)
    if (userExist) {
      return next(new ErrorResponse(`Customer email already exist`, 403))
    }
    const invoiceCustomer = await createInvoiceCustomer(data);
    if (!invoiceCustomer) {
      return next(new ErrorResponse(`Something went wrong while adding customer`, 500))
    } else {
      return res.status(201).json({
        status: true,
        message: "Invoice customer created successfully",
        data: invoiceCustomer,
        responseCode: '000'
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: '001'
    });
  }
});

exports.getCustomerById = asyncHandler(async (req, res, next) => {
  try {
    let { searchText, page, itemsPerPage } = req.query;
    let corporateId = req.user.corporateId

    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';

    // Parse page and itemsPerPage to integers (you can also use parseInt)
     page = page ? parseInt(page) : 1;
     itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
     let limit = itemsPerPage 
  
    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }

    let sortField = 'createdAt'

    let credentialAttribute = ['username', 'name']
    let customerAttribute = ['id', 'createdAt', 'name', 'email', 'phoneNumber', 'address', "trnNo"]

    let params ={

        searchText,
        sort,
        limit,
        offset,
        corporateId,
        credentialAttribute,
        customerAttribute,
        sortField

    }
    const invoiceCustomer = await getInvoiceCustomerById(params);
    return res.status(200).json({
      status: true,
      message: "Invoice customer retrieved successfully",
      data: invoiceCustomer,
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse(`Invoice customer not found`, 404));
  }
});

exports.updateCustomer = asyncHandler(async (req, res, next) => {
  try {
    let params = req.params
    params.corporateUserId = req.user.corporateId
    let data = req.body
    const userExist = await checkEmailExist(data.email,req.user.corporateId, params.id)
    if (userExist) {
      return next(new ErrorResponse(`Customer email already exist`, 403))
    }
    let result = await updateInvoiceCustomer(data, params);
    if(!result){
      return next(new ErrorResponse(`Something went wrong while updating customer`, 500))
    }else{
      return res.status(200).json({
        status: true,
        message: "Invoice customer updated successfully",
        data: {},
        responseCode: '000'
      });
    }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse(`Invoice customer not found`, 404));
  }
});

exports.deleteCustomer = asyncHandler(async (req, res, next) => {
  try {
    let params = req.params
    params.corporateUserId = req.user.corporateId
    let result = await deleteInvoiceCustomer(params);
    if(!result){
      return next(new ErrorResponse(`Something went wrong while deleting customer`, 500))
    }else{
    return res.status(200).json({
      status: true,
      message: "Invoice customer deleted successfully",
      data: {},
      responseCode: '000'
    });
  }
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return next(new ErrorResponse(`Invoice customer not found`, 404));
  }
});

exports.getAllCustomersByUserId = asyncHandler(async (req, res) => {
  try {
    let params = req.params
    params.corporateUserId = req.user.corporateId
    const invoiceCustomers = await getAllInvoiceCustomersByUserId(params);
    return res.status(200).json({
      status: true,
      message: "Invoice customers retrieved successfully",
      data: invoiceCustomers,
      responseCode: '000'
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data })
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: '001'
    });
  }
});

exports.getAllCorporate = asyncHandler(async (req, res, next) => {
  let searchText = req.query.searchText;
  let role = "CORPORATE";
  let data = await fetchAllCorporate(searchText, role);

  if (!data) {
    return next(new ErrorResponse(`Something went wrong while fetching all corporate user`, 500));
  } else {
    const corporateDetails = data.map(data => {
      return {
          value: data.credentialId,
          label: data.credential.name,
          email:data.email,
          mobileNo: data.mobileNo,
      };
  });
    return res.status(200).json({
      status: true,
      data: { corporateDetails },
      message: 'Fetched all corporate users successfully',
      responseCode: '000'
    });
  }
});

exports.getAllCustomers = asyncHandler(async (req, res, next) => {
  let searchText = req.query.searchText;
  let corporateId = req.user.corporateId
  let data = await fetchAllCustomers(searchText, corporateId);

  if (!data) {
    return next(new ErrorResponse(`Something went wrong while fetching all customers`, 500));
  } else {
    const customerDetails = data.map(data => {
      return {
          value: data.id,
          label: data.name,
          email:data.email,
          mobileNo: data.phoneNumber,
          address: data.address,
          trnNo: data.trnNo,
          // username: data.credential.username || null
      };
  });
    return res.status(200).json({
      status: true,
      data: { customerDetails },
      message: 'Fetched all customers successfully',
      responseCode: '000'
    });
  }
});
