const asyncHandler = require("../middleware/async");
const ErrorResponse = require('../utils/error-response');
const DeductionComponent = require("../models/entities/deductionComponent");
const Employee = require("../models/entities/employee");
const CorporateUser = require("../models/entities/corporateUser");
const Bonus = require("../models/entities/bonus");
const OverTime = require("../models/entities/overTime");
const Incentives = require("../models/entities/incentives");
 
const { createDeductionComponent,
    createEmployeeDeductionComponent,
    getAllDeductionComponents,
    getEmployeeDeductionComponents,
    editDeductionComponent,
    deleteDeductionComponent,
    updateDeductionComponent,
    getEmployeeDeductionComponentsList
    } = require("../models/use-cases/deductionComponent");
const {getEmployeeGrossSalary

} = require("../models/use-cases/salaryComponent")
const { recalculateAndUpsertProgress } = require("../services/progressCalculator");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const isBlockedPfName = (name) => typeof name === 'string' && name.trim().toLowerCase() === 'provident fund (pf)';

//create deduction component
exports.createDeductionComponent = asyncHandler(async (req, res) => {

    const corporateUserID = req.user._id;
    const { deductionName,isGlobal } = req.body;
    if (isGlobal && isBlockedPfName(deductionName)) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'Provident Fund is configured under Compliance Settings > EPF, not here.',
        });
    }
    const existingDeductionComponent = await DeductionComponent.findOne({
     corporateUser: corporateUserID,
     isGlobal:isGlobal,
     employee: null,
     deductionName: { $regex: `^${escapeRegex(deductionName)}$`, $options: 'i' }, 
 });
 console.log(existingDeductionComponent);
 if (existingDeductionComponent) {
     return res.status(400).json({
         status: false,
         responseCode: '001',
         message: 'Deduction component with the same name already exists.',
     });
 }
    if (req.body.employee && !(await isEmployeeOfCorporate(req.body.employee, corporateUserID))) {
        return res.status(404).json({
            status: false,
            responseCode: '404',
            message: 'Employee not found',
        });
    }
    let data = {
        ...sanitizeBody(req.body),
        ...(req.body.employee ? { employee: req.body.employee } : {}),
        corporateUser: corporateUserID,
    }
    const result = await createDeductionComponent(data)
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Deduction component created successfully",
        data: result,
    })
 
})



// for creating employee-specific deduction component
exports.createEmployeeDeductionComponent = asyncHandler(async (req, res) => {
    const corporateUserID = req.user._id; 
    const { employeeId } = req.params;   
    const { deductionName, globalComponentId } = req.body;

    // Check if the employee exists in the system

    const employee = await Employee.findOne({ _id: employeeId, corporateUser: corporateUserID });
    if (!employee) {
        return res.status(404).json({
            status: false,
            responseCode: '404',
            message: 'Employee not found',
        });
    }

    

    const existingDeductionComponent = await DeductionComponent.findOne({
        corporateUser: corporateUserID,
        employee: employeeId,
        deductionName: { $regex: `^${escapeRegex(deductionName)}$`, $options: 'i' }, 
    });

    if (existingDeductionComponent) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'Deduction component with the same name already exists for this employee.',
        });
    }

    
    // Self-healing fallback: if the caller didn't pass globalComponentId (e.g. the
    // frontend's onboarding submission didn't have it flagged isGlobal at that moment —
    // whatever the reason, trusting the caller alone here is what let an employee's PF
    // row start out unlinked from the org's global template), fall back to a name match
    // against the org's global deductions. Without this, a later edit through
    // updateDeductionComponent (which looks up by globalComponentId) can't find this row
    // and creates a SECOND, properly-linked one instead — the exact "PF shown twice" bug.
    // Only link to a global template that belongs to this corporate.
    let resolvedGlobalComponentId =
        globalComponentId && (await DeductionComponent.exists({ _id: globalComponentId, corporateUser: corporateUserID }))
            ? globalComponentId
            : null;
    if (!resolvedGlobalComponentId) {
        // Escape regex metacharacters in the name — "Provident Fund (PF)" contains
        // parentheses, which unescaped turn into a capture group and silently stop
        // matching the literal string (this exact gap is why the very first version of
        // this fallback failed to find "Provident Fund (PF)" at all).
        const escapedName = deductionName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const globalTemplate = await DeductionComponent.findOne({
            corporateUser: corporateUserID,
            isGlobal: true,
            employee: null,
            deductionName: { $regex: `^${escapedName}$`, $options: 'i' },
        });
        if (globalTemplate) resolvedGlobalComponentId = globalTemplate._id;
    }

    let data = {
        ...sanitizeBody(req.body),
        corporateUser: corporateUserID,
        employee: employeeId,
        isGlobal: false,
        globalComponentId: resolvedGlobalComponentId
    };


    const result = await createEmployeeDeductionComponent(data);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Employee-specific deduction component created successfully",
        data: result,
    });
});





//UPDATE DEDUCTION COMPONENT WHEN EMPLOYEE ID IS PRESENT
exports.updateDeductionComponent = asyncHandler(async (req, res) => {
    const { id } = req.params; // Deduction component ID
    const { employeeId } = req.body; // Employee ID (if it's employee-specific)
    const corporateUserID = req.user._id;
    const updateFields = sanitizeBody(req.body, ['isGlobal', 'globalComponentId']);

    try {
        if (employeeId && !(await isEmployeeOfCorporate(employeeId, corporateUserID))) {
            throw new Error('Employee not found');
        }
       
        const result = await updateDeductionComponent({
            id,
            corporateUserID,
            employeeId,
            updateFields,
        });

        let message = 'Deduction component updated successfully';
        if (result.status === 'created') {
            message = 'Employee-specific deduction component created successfully';
        }

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: message,
            data: result.component,
        });
    } catch (error) {
        
        return res.status(400).json({
            status: false,
            responseCode: '400',
            message: error.message || 'Failed to update deduction component',
        });
    }
});



 
//get all deduction components
exports.getAllDeductionComponents = asyncHandler(async (req, res, next) => {
 
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
        skip,
        // Deduction Components (Settings tab) intentionally hides "Provident Fund (PF)" —
        // it's driven by Compliance Settings > EPF, not configured here. CTC-preview
        // consumers (Dashboard Calculator, Add Employee, New Hire) reuse this same
        // endpoint to seed their starting structure and pass this so PF isn't invisible in
        // the preview, even though it's still calculated correctly for real employees
        // regardless of this flag (see getEmployeeDeductionComponentsList).
        includePf: req.query.includePf === 'true',
    }
    const type = req.query?.type || '';
    if (type !== 'setting') {
        await CorporateUser.findOneAndUpdate(
            { _id: corporateUserID, onboardStatus: { $lt: 3 } },
            { $set: { onboardStatus: 3 } },
            { new: true }
        );
        recalculateAndUpsertProgress(corporateUserID).catch(err =>
            console.error('[Progress] Failed to update progress:', err.message)
        );
    }
    const result = await getAllDeductionComponents(params);
 
    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching deduction components', 400));
    }
 
    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Deduction components fetched successfully',
        data: result
    });
 
})
//get employee deduction components
exports.getEmployeeDeductionComponents = asyncHandler(async (req, res, next) => {
 
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
 
    const result = await getEmployeeDeductionComponents(params);
 
    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching deduction components', 400));
    }
 
    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Deduction components fetched successfully',
        data: result
    });
 
})
//edit deduction component
exports.editDeductionComponent = asyncHandler(async (req, res, next) => {
 
    const corporateUserID = req.user._id;
    const componentId = req.params.id;
    const editData = sanitizeBody(req.body);
 
    const foundDeductionComponent = await DeductionComponent.findOne({
        _id: componentId,
        corporateUser: corporateUserID
    });
 
    if (!foundDeductionComponent) {
        return next(new ErrorResponse('Deduction component data not found or unauthorized to edit', 400));
    }
    if (foundDeductionComponent.isGlobal && isBlockedPfName(editData.deductionName)) {
        return next(new ErrorResponse('Provident Fund is configured under Compliance Settings > EPF, not here.', 400));
    }
    const params = {
        corporateUserID,
        componentId,
        editData
    }
 
    if (foundDeductionComponent) {
        const result = await editDeductionComponent(params);
 
        if (result.ErrorResponse) {
            return next(new ErrorResponse(result.ErrorResponse, 400));
        }
 
        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Deduction component data updated successfully',
            data: result
        });
    }
 
})
//delete deduction component
exports.deleteDeductionComponent = asyncHandler(async (req, res, next) => {
 
    const corporateUserID = req.user._id;
    const componentId = req.params.id;
 
    const foundDeductionComponent = await DeductionComponent.findOne({
        _id: componentId,
        corporateUser: corporateUserID
    });
    if (!foundDeductionComponent) {
        return next(new ErrorResponse('Deduction component not found or unauthorized to delete', 400));
    }
 
    const params = {
        corporateUserID,
        componentId
    }
 
    const result = await deleteDeductionComponent(params);
 
    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Deduction component deleted successfully',
        data: result
    });
 
})



//get list of deduction components for employee profile




exports.getEmployeeDeductionComponentList = asyncHandler(async (req, res) => {
    try {
        const corporateUserID = req.user._id; 
        const { id: employeeId } = req.params; // Employee ID from the route parameter

        const result = await getEmployeeDeductionComponentsList({
            corporateUserID,
            employeeId,
        });
        const empGrossSalary = await getEmployeeGrossSalary({corporateUserID,employeeId});
        const grossSalaryWithBonus = await calculateBonusIncentivesOvertime({corporateUserID,employeeId});
        const extraEarnings = Math.floor(
            Number(grossSalaryWithBonus?.totalExtraEarnings || 0)
        );
        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Deduction components fetched successfully',
            data: result.componentData,
            totalCount: result.totalCount,
            grossSalary: Number(empGrossSalary.grossSalary || 0) + extraEarnings,
            totalDeductions: Number(empGrossSalary.totalDeductions || 0),
        });
    } catch (error) {
        // Handle errors and send error response
        return res.status(500).json({
            status: false,
            responseCode: '500',
            message: error.message || 'Internal Server Error',
        });
    }
});

exports.getEmployeeDeductionForSalaryProcess = asyncHandler(async (req, res) => {
    try {
        const corporateUserID = req.user._id;
        const basicPay = 20000; // You can replace this with dynamic value if needed
        const { id: employeeId } = req.params; // Employee ID from the route parameter

        const result = await getEmployeeDeductionComponentsList({
            corporateUserID,
            employeeId,
        });

        const empGrossSalary = await getEmployeeGrossSalary({ corporateUserID, employeeId });

        // Calculate the sum of amounts based on calculationType
        let totalDeductionAmount = 0;
        for (const component of result.componentData) {
            if (component.calculationType === 'fixed') {
                totalDeductionAmount += component.amountInPercentage;
            } else if (component.calculationType === 'percentage') {
                totalDeductionAmount += (component.amountInPercentage / 100) * basicPay;
            }
        }

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Deduction components fetched successfully',
            data: result.componentData,
            totalCount: result.totalCount,
            grossSalary: empGrossSalary.grossSalary,
            totalDeductionAmount,
        });
    } catch (error) {
        // Handle errors and send error response
        return res.status(500).json({
            status: false,
            responseCode: '500',
            message: error.message || 'Internal Server Error',
        });
    }
});

async function calculateBonusIncentivesOvertime(params) {
  try {
    const { corporateUserID, employeeId } = params;

    if (!corporateUserID || !employeeId) {
      return {
        incentiveAmount: 0,
        bonusAmount: 0,
        overtimeAmount: 0,
        totalExtraEarnings: 0
      };
    }

    /* ------------------------------------
       Current month date range
    ------------------------------------ */
    const now = new Date();

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    /* ------------------------------------
       INCENTIVES (current month)
    ------------------------------------ */
    const incentives = await Incentives.find({
      corporateUser: corporateUserID,
      employee: employeeId,
      incentiveDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      }
    });

    const incentiveAmount = incentives.reduce(
      (sum, item) => sum + Number(item.amount || 0),
      0
    );

    /* ------------------------------------
       BONUS (current month + unpaid)
    ------------------------------------ */
    const bonuses = await Bonus.find({
      corporateUser: corporateUserID,
      employee: employeeId,
      bonusDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      },
      paymentStatus: 'UNPAID'
    });

    const bonusAmount = bonuses.reduce(
      (sum, item) => sum + Number(item.bonusAmount || 0),
      0
    );

    /* ------------------------------------
       OVERTIME (current month + unpaid)
    ------------------------------------ */
    const overTimes = await OverTime.find({
      corporateUser: corporateUserID,
      employee: employeeId,
      overTimeDate: {
        $gte: startOfMonth,
        $lte: endOfMonth
      },
      paymentStatus: 'UNPAID'
    });

    const overtimeAmount = overTimes.reduce(
      (sum, item) => sum + Number(item.overTimeAmount || 0),
      0
    );

    /* ------------------------------------
       TOTAL EXTRA EARNINGS
    ------------------------------------ */
    const totalExtraEarnings = Math.floor(
      incentiveAmount + bonusAmount + overtimeAmount
    );  

    return {
      incentiveAmount,
      bonusAmount,
      overtimeAmount,
      totalExtraEarnings
    };
  } catch (error) {
    console.error("Error calculating bonus/incentive/overtime:", error);
    throw error; // let caller handle it
  }
}


