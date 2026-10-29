const asyncHandler = require("../middleware/async");
const Incentives = require("../models/entities/incentives");
const { deleteIncentive, fetchAllIncentivesData } = require("../models/use-cases/incentives");
const { createIncentive, getAllIncentivesData, editIncentive } = require("../models/use-cases/incentives");
const ErrorResponse = require("../utils/error-response");
const { checkSalaryDate } = require("../utils/salaryDate");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");
const {
    verifyEffectiveDateForCompensationComponents,
  } = require("../services/commonServices");



exports.createIncentive = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;

    if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    let data = {
        ...sanitizeBody(req.body),
        corporateUser: corporateUserID,
        employee: employeeId
    }

    const { incentiveDate } = req.body;
    const isVerified=await verifyEffectiveDateForCompensationComponents(
        corporateUserID,
        employeeId,
        incentiveDate
      );
      
      if (!isVerified.status) {
        return next(new ErrorResponse(isVerified.message, 400));
      }
    const checkConditions = await checkSalaryDate(incentiveDate, employeeId);

    if (!checkConditions) {
        return next(new ErrorResponse('The date that you have provided is not valid.', 400));
    }
    const result = await createIncentive(data)
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Incentive created successfully",
        data: result,
    })

})

exports.getAllIncentives = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || '';
    const skip = (page - 1) * limit;
    const month = req.query.month
    const year = req.query.year

    const params = {
        corporateUserID,
        employeeId,
        page,
        limit,
        searchText,
        skip,
        month,
        year
    }

    const result = await getAllIncentivesData(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching incentives data', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Incentives data fetched successfully',
        data: result
    });

})

exports.fetchAllIncentives = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || '';
    const skip = (page - 1) * limit;

    const params = {
        corporateUserID,
        page,
        limit,
        searchText,
        skip
    }

    const result = await fetchAllIncentivesData(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching incentives data', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Incentives data fetched successfully',
        data: result
    });

})

exports.editIncentive = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const incentiveId = req.params.id;
    const editData = sanitizeBody(req.body);
    const { incentiveDate, employeeId } = req.body;

    const foundIncentive = await Incentives.findOne({
        _id: incentiveId,
        corporateUser: corporateUserID
    });

    if (!foundIncentive) {
        return next(new ErrorResponse('incentive data not found or unauthorized to edit', 400));
    }

    if (employeeId && !(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    const checkConditions = await checkSalaryDate(incentiveDate, employeeId);

    if (!checkConditions) {
        return next(new ErrorResponse('The date that you have provided is not valid.', 400));
    }

    if (foundIncentive.paymentStatus === 'PAID') {
        return next(new ErrorResponse('Cannot edit. incentive is already paid.', 400));
    }

    const params = {
        corporateUserID,
        incentiveId,
        editData
    }

    if (foundIncentive) {
        const result = await editIncentive(params);

        if (result.ErrorResponse) {
            return next(new ErrorResponse(result.ErrorResponse, 400));
        }

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Incentive data updated successfully',
            data: result
        });
    }

})

exports.deleteIncentive = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const incentiveId = req.params.id;

    const foundIncentive = await Incentives.findOne({
        _id: incentiveId,
        corporateUser: corporateUserID
    });
    if (!foundIncentive) {
        return next(new ErrorResponse('incentive data not found or unauthorized to delete', 400));
    }

    if (foundIncentive.paymentStatus === 'PAID') {
        return next(new ErrorResponse('Cannot delete. incentive is already paid.', 400));
    }

    const params = {
        corporateUserID,
        incentiveId
    }

    const result = await deleteIncentive(params);

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'incentive deleted successfully',
        data: result
    });

})

exports.getIncentiveUsingId = asyncHandler(async (req, res, next) => {

    const { incentiveId } = req.params;
    const incentiveData = await Incentives.findOne({ _id: incentiveId, corporateUser: req.user._id })
    if (!incentiveData) {
        return next(new ErrorResponse('something went wrong while fetching incentive data', 400));
    } else {
        return res.status(201).json({
            status: true,
            data: incentiveData,
            message: 'incentive data fetched successfully',
            responseCode: '000'
        })
    }

})