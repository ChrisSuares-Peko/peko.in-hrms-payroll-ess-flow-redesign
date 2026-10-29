const asyncHandler = require("../middleware/async");
const Bonus = require("../models/entities/bonus");
const SalaryComponent = require("../models/entities/salaryComponent");
const { createBonusData, getAllBounusUsingId, editBonus, deleteBonus, getAllBounus } = require("../models/use-cases/bonus");
const { getEmployeesUsingId } = require("../models/use-cases/employee");
const ErrorResponse = require('../utils/error-response');
const { checkSalaryDate } = require("../utils/salaryDate");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");

exports.createBonus = asyncHandler(async (req, res, next) => {
    
        const corporateUserID = req.user._id;
        const employeeId = req.params.id;
        const bonusData = sanitizeBody(req.body);

        if (!(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
            return next(new ErrorResponse('Employee not found', 404));
        }

        const params = {
            corporateUserID,
            employeeId,
            bonusData
        }

        const {bonusDate} = req.body;

        const checkConditions = await checkSalaryDate(bonusDate, employeeId);

        if (!checkConditions) {
            return next(new ErrorResponse('The date that you have provided is not valid.', 400));
        }

        const result = await createBonusData(params);

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Bonus added successfully',
            data: result
        });

})

exports.getAllBonus = asyncHandler(async (req, res, next) => {
    
        const corporateUserID = req.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const searchText = req.query.searchText || '';
        const skip = (page - 1) * limit;
        const from = req.query.from
        const to = req.query.to

        const params = {
            corporateUserID,
            page,
            limit,
            searchText,
            skip,
            from,
            to
        }

        const result = await getAllBounus(params);

        if (result.errors) {
            return next(new ErrorResponse('something went wrong while fetching bonus data', 400));
        }

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Bonus data fetched successfully',
            data: result
        });

})

exports.getBounusUsingId = asyncHandler(async (req, res, next) => {
    
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

        const result = await getAllBounusUsingId(params);

        if (result.errors) {
            return next(new ErrorResponse('something went wrong while fetching bonus data', 400));
        }

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Bonus data fetched successfully',
            data: result
        });

})

exports.editBonusUsingId = asyncHandler(async (req, res, next) => {
    
        const corporateUserID = req.user._id;
        const bonusId = req.params.id;
        const editData = sanitizeBody(req.body);

        const foundBonus = await Bonus.findOne({
            _id: bonusId,
            corporateUser: corporateUserID
        });

        if (!foundBonus) {
            return next(new ErrorResponse('bonus not found or unauthorized to edit', 400));
        }

        if (editData?.employeeId && !(await isEmployeeOfCorporate(editData.employeeId, corporateUserID))) {
            return next(new ErrorResponse('Employee not found', 404));
        }

        const checkConditions = await checkSalaryDate(editData?.bonusDate, editData?.employeeId);

        if (!checkConditions) {
            return next(new ErrorResponse('The date that you have provided is not valid.', 400));
        }

        if (foundBonus.paymentStatus === 'PAID') {
            return next(new ErrorResponse('Cannot edit. bonus is already paid.', 400));
        }

        const params = {
            corporateUserID,
            bonusId,
            editData
        }

        if (foundBonus) {
            const result = await editBonus(params);

            if (result.ErrorResponse) {
                return next(new ErrorResponse(result.ErrorResponse, 400));
            }

            return res.status(201).json({
                status: true,
                responseCode: '000',
                message: 'Bonus updated successfully',
                data: result
            });
        }

})

exports.deleteBonus = asyncHandler(async (req, res, next) => {
    
        const corporateUserID = req.user._id;
        const bonusId = req.params.id;

        const foundBonus = await Bonus.findOne({
            _id: bonusId,
            corporateUser: corporateUserID
        });
        if (!foundBonus) {
            return next(new ErrorResponse('Bonus data not found or unauthorized to delete', 400));
        }

        if (foundBonus.paymentStatus === 'PAID') {
            return next(new ErrorResponse('Cannot delete. overtime is already paid.', 400));
        }

        const params = {
            corporateUserID,
            bonusId
        }

        const result = await deleteBonus(params);

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Bonus deleted successfully',
            data: result
        });

})

exports.fetchBonusAmount = asyncHandler(async (req, res, next) => {
    
        const employeeId = req.params.id;
        const { type, bonusPercentage, bonusAmount } = req.body;

        if (!(await isEmployeeOfCorporate(employeeId, req.user._id))) {
            return next(new ErrorResponse('Employee not found', 404));
        }

        const employeeDetails = await getEmployeesUsingId(employeeId);
        if (!employeeDetails ) {
            return {
                status: false,
                responseCode: '001',
                message: 'something went wrong while calculating overtime data',
                data: {}
            }
        }

        //find basic salary
        const queryConditions = {
            corporateUser: req.user._id,
            employee: employeeId,
        };
  
      
        const globalComponentData = await SalaryComponent.find({
            corporateUser: req.user._id,
            employee: null,
            isGlobal:true
        });
        const employeeComponentData = await SalaryComponent.find(queryConditions);
  
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
        const basicSalary = basicSalaryComponent?.amount||0;

        if (type === "percentage") {
            let bonusAmount = (basicSalary * bonusPercentage) / 100;
            return res.status(201).json({
                status: true,
                responseCode: '000',
                message: 'Bonus amount calculated successfully',
                data: { bonusAmount }
            });
        } else {
            let bonusPercentage = (bonusAmount / basicSalary) * 100;
            return res.status(201).json({
                status: true,
                responseCode: '000',
                message: 'Bonus percentage calculated successfully',
                data: { bonusPercentage }
            });
        }

})

exports.fetchSingleBonusUsingId = asyncHandler(async (req, res, next) => {
    
        const { bonusId } = req.params;
        const bonusData = await Bonus.findOne({ _id: bonusId, corporateUser: req.user._id })  
        if (!bonusData) {
            return next(new ErrorResponse('something went wrong while fetching bonus data', 400));
        } else {
            return res.status(201).json({
                status: true,
                data: bonusData,
                message: 'bonus data fetched successfully',
                responseCode: '000'
            })
        }
   
})