const asyncHandler = require("../middleware/async");
const salaryComponent = require("../models/entities/salaryComponent");
const Increment = require("../models/entities/increment");
const { getEmployeesUsingId } = require("../models/use-cases/employee");
const { createIncrement, getAllIncrementData, editIncrement, deleteIncrement, findMultiIncrementsForMonth } = require("../models/use-cases/increment");
const { fetchAdjustedBasicPay } = require("../services/increment");
const ErrorResponse = require("../utils/error-response");
const { checkSalaryDate } = require("../utils/salaryDate");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");


exports.createIncrement = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const { employeeId } = req.params;

    if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    let data = {
        ...sanitizeBody(req.body),
        corporateUser: corporateUserID,
        employee: employeeId
    }

    const { effectiveDate } = req.body;
    const currentDate = new Date();
    if (new Date(effectiveDate) < currentDate) {
        return next(new ErrorResponse('You cannot add increment for this date', 400));
    }

    const { status, message } = await findMultiIncrementsForMonth({ effectiveDate, employeeId, corporateUserID })
    if (!status) return next(new ErrorResponse(message, 400));

    // const isVerified=await verifyEffectiveDateForCompensationComponents(
    //     corporateUserID,
    //     employeeId,
    //    effectiveDate
    //   );
      
    //   if (!isVerified.status) {
    //     return next(new ErrorResponse(isVerified.message, 400));
    //   }

    const checkConditions = await checkSalaryDate(effectiveDate, employeeId);

    if (!checkConditions) {
        return next(new ErrorResponse('The date that you have provided is not valid.', 400));
    }

    const result = await createIncrement(data)

    if (!result?.errors) {
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: "Increment created successfully",
            data: result,
        });
    } else {
        return next(new ErrorResponse(result?.errors?.attachment, 400));
    }

})
exports.calculateBasicSalaryForIncrement = asyncHandler(async (req, res, next) => {

    const { employeeId } = req.params;
    let { month, year } = req.query
    const corporateUserID = req.user._id;
    if (!month || !year) return next(new ErrorResponse('Something went wrong while fetching employee data', 400));
    // let { payrollSettings: { salaryCycleDay } = {} } = await HrSettings.findOne({ corporateUser: corporateUserID });

    // if (salaryCycleDay === undefined || typeof salaryCycleDay !== 'number' || !Number.isInteger(salaryCycleDay)) {
    //     return next(new ErrorResponse('HR settings not found or invalid salary cycle day for this corporate user', 400));
    // }

    if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    // Fetch employee details
    const employeeDetails = await getEmployeesUsingId(employeeId);
    if (!employeeDetails) return next(new ErrorResponse('Something went wrong while fetching employee data', 400));

    // Extract basic salary from employee details
    // const basicSalary = employeeDetails?.salaryInformation?.basicPay;
    //find basic salary
    const queryConditions = {
        corporateUser: req.user._id,
        employee: employeeId,
    };

  
    const globalComponentData = await salaryComponent.find({
        corporateUser: req.user._id,
        employee: null,
        isGlobal:true
    });
    const employeeComponentData = await salaryComponent.find(queryConditions);

    const employeeComponentMap = new Map(
        employeeComponentData
            .filter(component => component.globalComponentId)
            .map(component => [component.globalComponentId.toString(), component])
    );

    const combinedComponentData = globalComponentData.map(globalComponent => {
        const overriddenComponent = employeeComponentMap.get(globalComponent._id.toString());

        return overriddenComponent || globalComponent;
    });
    const uniqueEmployeeComponents = employeeComponentData.filter(component => !component.globalComponentId);
    combinedComponentData.push(...uniqueEmployeeComponents);
    const basicSalaryComponent = combinedComponentData.find(
        (component) => component.componentName === 'Basic Salary'
    );
    const basicSalary = basicSalaryComponent?.amountPercentage||0;
      console.log("basicSalaryComponent",basicSalaryComponent)

    if (!basicSalary) return next(new ErrorResponse('Basic salary not found for the employee', 400));

    const { dateOfJoin } = employeeDetails.employeeInformation

    let updatedBasicSalary = await fetchAdjustedBasicPay({
        basicPay: basicSalary,
        corporateUserID,
        dateOfJoin,
        employeeId,
        month,
        year
    })
    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Updated basic salary fetched successfully',
        data: { basicSalary: updatedBasicSalary,basicSalaryComponent:basicSalaryComponent }
    });
})

exports.calculateIncrement = asyncHandler(async (req, res, next) => {

    const { employeeId } = req.params;
    const { type } = req.body;
    const basicSalary = parseFloat(req.body?.basicSalary || 0)
    const incrementAmount = parseFloat(req.body?.incrementAmount || 0)
    const incrementPercentage = parseFloat(req.body?.incrementPercentage || 0)

    if (!(await isEmployeeOfCorporate(employeeId, req.user._id))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    // Fetch employee details
    const employeeDetails = await getEmployeesUsingId(employeeId);
    if (!employeeDetails) {
        return next(new ErrorResponse('Something went wrong while fetching employee data', 400));
    }

    // // Extract basic salary from employee details
    // const basicSalary = employeeDetails?.salaryInformation?.basicPay;
    // if (!basicSalary) {
    //     return next(new ErrorResponse('Basic salary not found for the employee', 400));
    // }

    let newBasicSalary;

    if (type === 'percentage') {
        // Calculate increment amount based on percentage
        const calculatedIncrementAmount = (basicSalary * incrementPercentage) / 100;
        console.log({ calculatedIncrementAmount, basicSalary })
        newBasicSalary = basicSalary + calculatedIncrementAmount;
        return res.status(201).json({
            status: true,
            data: {
                incrementAmount: calculatedIncrementAmount,
                incrementPercentage,
                newBasicSalary
            },
            message: 'New basic salary calculated successfully',
            responseCode: '000'
        });
    } else if (type === 'flat') {
        // Calculate new basic salary based on provided increment amount
        newBasicSalary = basicSalary + incrementAmount;
        // Calculate increment percentage based on provided increment amount
        const calculatedIncrementPercentage = (incrementAmount * 100) / basicSalary;
        return res.status(201).json({
            status: true,
            data: {
                incrementAmount,
                incrementPercentage: calculatedIncrementPercentage,
                newBasicSalary
            },
            message: 'New basic salary calculated successfully',
            responseCode: '000'
        });
    } else {
        return next(new ErrorResponse('Invalid increment type. Please provide "percentage" or "flat".', 400));
    }
})

exports.fetchAllIncrement = asyncHandler(async (req, res, next) => {

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

    const result = await getAllIncrementData(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching increment data', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Increment data fetched successfully',
        data: result
    });

})

exports.updateIncrement = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const { incrementId } = req.params;
    const editData = sanitizeBody(req.body);
    const { effectiveDate, employeeId } = req.body;

    const currentDate = new Date();
    if (new Date(effectiveDate) < currentDate) {
        return next(new ErrorResponse('You cannot add increment for this date', 400));
    }

    const foundIncrement = await Increment.findOne({
        _id: incrementId,
        corporateUser: corporateUserID
    });

    if (!foundIncrement) {
        return next(new ErrorResponse('Increment data not found or unauthorized to edit', 400));
    }

    if (employeeId && !(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    const checkConditions = await checkSalaryDate(effectiveDate, employeeId);

    if (!checkConditions) {
        return next(new ErrorResponse('The date that you have provided is not valid.', 400));
    }

    if (foundIncrement.status === 'reflected') {
        return next(new ErrorResponse('Cannot edit. increment is already reflected to basic salary.', 400));
    }

    const params = {
        corporateUserID,
        incrementId,
        editData
    }

    if (foundIncrement) {
        const result = await editIncrement(params);

        if (result.ErrorResponse) {
            return next(new ErrorResponse(result.ErrorResponse, 400));
        }

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Increment updated successfully',
            data: result
        });
    }

})

exports.deleteIncrement = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const { incrementId } = req.params;

    const foundIncrement = await Increment.findOne({
        _id: incrementId,
        corporateUser: corporateUserID
    });
    if (!foundIncrement) {
        return next(new ErrorResponse('increment data not found or unauthorized to delete', 400));
    }

    if (foundIncrement.paymentStatus === 'PAID') {
        return next(new ErrorResponse('Cannot delete. increment is already paid.', 400));
    }

    const params = {
        corporateUserID,
        incrementId
    }

    const result = await deleteIncrement(params);

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Increment deleted successfully',
        data: result
    });

})

exports.fetchSingleIncrement = asyncHandler(async (req, res, next) => {

    const { incrementId } = req.params;
    const incrementData = await Increment.findOne({ _id: incrementId, corporateUser: req.user._id })
    if (!incrementData) {
        return next(new ErrorResponse('something went wrong while fetching increment data', 400));
    } else {
        return res.status(201).json({
            status: true,
            data: incrementData,
            message: 'Increment data fetched successfully',
            responseCode: '000'
        })
    }
})