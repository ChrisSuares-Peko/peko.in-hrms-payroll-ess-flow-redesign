const asyncHandler = require("../middleware/async");
const ErrorResponse = require('../utils/error-response');
const SalaryComponent = require("../models/entities/salaryComponent");
const CorporateUser = require("../models/entities/corporateUser");

const { createSalaryComponent,getAllSalaryComponents,getEmployeeSalaryComponents,getEmployeeSalaryComponentList,getEmployeeSalaryComponentwithCount,deleteSalaryComponent,calculateSalaryComponent,getCurrentEmployeeComponent,getCurrentComponent,getEmployeeSalaryComponentListByEmail,redistributeBasicSalary,redistributeEarningComponent,persistComponentAmount} = require("../models/use-cases/salaryComponent");
const { recalculateAndUpsertProgress } = require("../services/progressCalculator");
const { reviseSalary, undoLatestRevision } = require("../models/use-cases/reviseSalary");
const { getEmployeeCtcBreakdown } = require("../models/use-cases/ctcCalculator");
const { mergeGlobalAndEmployeeComponents, isBalancingComponent, differsFromGlobalRule } = require("../models/use-cases/mergeComponents");
const SalaryStructureVersion = require("../models/entities/salaryStructureVersion");
const { logAudit } = require("../services/auditLog");
const { sanitizeBody, isEmployeeOfCorporate } = require("../utils/tenantScope");

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const formatMoney = (amount) => Math.round(amount).toLocaleString('en-IN');

// Resolves a to-be-added/edited component's monthly rupee amount from its submitted
// calculationType/amountPercentage/calculationBasis/calculationBasedOn against a known CTC
// breakdown — close enough to resolveEarnings' own PERCENTAGE branch (mergeComponents.js)
// for a pre-submit "does this fit" check; the actual persisted amount is still computed by
// the real resolve engine once this passes.
const resolveNewComponentAmount = ({ calculationType, amountPercentage, calculationBasis, calculationBasedOn }, breakdown) => {
    const amount = Number(amountPercentage) || 0;
    if (calculationType === 'FIXED') return amount;
    if (calculationType !== 'PERCENTAGE') return 0;
    if (calculationBasis === 'GROSS_SALARY') return (amount / 100) * breakdown.grossSalary;
    if (calculationBasis === 'BASIC_SALARY') return (amount / 100) * breakdown.basicSalary;
    if (calculationBasis === 'CTC') return (amount / 100) * (breakdown.annualCtc / 12);
    // Otherwise a specific referenced component (calculationBasedOn holds its id, as sent
    // by EmployeeSalaryCompModalForm's "Calculation Basis" dropdown).
    const ref = breakdown.earnings.find((e) => e.id === calculationBasedOn);
    return (amount / 100) * (ref ? ref.calculatedAmount : 0);
};

// Rejects a new/edited earning component that would push the Balancing component (e.g.
// Other Allowance) below ₹0 — it must always absorb a non-negative remainder of Gross.
// Returns { error } when it doesn't fit, or { newBalancingAmount } (the Balancing
// component's correct amount once this change is applied) when it does — the caller
// persists that so the Balancing snapshot never goes stale after a successful add/edit
// (see rebalanceComponent below).
const validateFitsAvailableCtc = async ({ corporateUserID, employeeId, componentData, excludeComponentId }) => {
    // No real employee yet (email-only linking) — nothing to resolve a breakdown against.
    if (!employeeId) return { newBalancingAmount: null };
    if (String(componentData.calculationType).toUpperCase() === 'BALANCING' || componentData.isPartOfGross === false) {
        return { newBalancingAmount: null };
    }

    const breakdown = await getEmployeeCtcBreakdown({ corporateUserID, employeeId });
    const balancingEarning = breakdown.earnings.find((e) => e.calculationType === 'BALANCING');
    if (!balancingEarning) return { newBalancingAmount: null }; // Nothing configured to absorb a remainder — doesn't apply.

    // Editing an existing component: its OWN current contribution is already subtracted out
    // of balancingEarning's amount, so add it back before checking the NEW amount fits.
    const existing = excludeComponentId ? breakdown.earnings.find((e) => e.id === excludeComponentId) : null;
    const available = balancingEarning.calculatedAmount + (existing ? existing.calculatedAmount : 0);

    const newAmount = resolveNewComponentAmount(componentData, breakdown);
    if (newAmount > available + 0.01) {
        return {
            error: `This doesn't fit: after Basic, HRA and the other components, only ₹${formatMoney(available)} / month of this CTC is left. Enter a smaller amount.`,
        };
    }
    return { newBalancingAmount: available - newAmount };
};

// Persists the Balancing component's corrected remainder right after a successful
// add/edit — otherwise its snapshot goes stale until the next Revise Salary, and a
// SUBSEQUENT add/edit's "how much is left" check would measure against the wrong total.
const rebalanceComponent = async ({ corporateUserID, employeeId, newBalancingAmount }) => {
    if (!employeeId || newBalancingAmount === null || newBalancingAmount === undefined) return;
    const [mergedComponents, globalEarningTemplates] = await Promise.all([
        mergeGlobalAndEmployeeComponents(SalaryComponent, { corporateUserID, employeeId }),
        SalaryComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }).lean(),
    ]);
    const globalComponentsById = new Map(globalEarningTemplates.map((t) => [t._id.toString(), t]));
    const balancingComponent = mergedComponents.find((c) => isBalancingComponent(c, globalComponentsById));
    if (!balancingComponent) return;
    await persistComponentAmount(corporateUserID, employeeId, balancingComponent, Math.max(0, newBalancingAmount), {
        calculationType: 'BALANCING',
    });
};

// A Balancing component absorbs whatever's left of Gross, so only one can meaningfully
// exist at the org level at a time — that's the actual constraint the CTC/salary engine
// depends on (mergeComponents.js's resolveEarnings/solveEarningsForCtc identify the role
// purely via calculationType === 'BALANCING', never by name), so the name itself can be
// anything the org wants. This only gates the GLOBAL create/edit flows below — an
// employee-specific override always mirrors an existing global Balancing component's role
// rather than being independently chosen as one through these endpoints.
const validateBalancingComponent = async ({ corporateUserID, excludeComponentId }) => {
    const existingBalancing = await SalaryComponent.findOne({
        corporateUser: corporateUserID,
        // isGlobal: true is the actual signal for "this org's global template" (same as
        // mergeGlobalAndEmployeeComponents' own global fetch) — employee: {$exists: false}
        // alone isn't a reliable substitute for it: an org can accumulate SalaryComponent
        // rows that are neither a real global template nor tied to an employee (stale/
        // orphaned data from elsewhere), and those were being counted here as if they were
        // the org's one global Balancing component, permanently blocking a rename of the
        // real one.
        isGlobal: true,
        employee: { $exists: false },
        calculationType: 'BALANCING',
        status: 'ACTIVE',
        ...(excludeComponentId ? { _id: { $ne: excludeComponentId } } : {}),
    });
    if (existingBalancing) {
        return `A Balancing component ("${existingBalancing.componentName}") already exists. Only one Balancing component is allowed at a time.`;
    }
    return null;
};

//create salary component
exports.createSalaryComponent = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    const { componentName, employee, calculationType } = req.body;  // Replace employeeId with employee

    if (employee && !(await isEmployeeOfCorporate(employee, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }

    // Define the base query conditions for finding existing components
    const queryConditions = {
        corporateUser: corporateUserID,
        componentName: { $regex: `^${escapeRegex(componentName)}$`, $options: 'i' },  // Case-insensitive match
    };

    // If employee exists in the request body, we are dealing with an employee-specific component
    if (employee) {
        queryConditions.employee = employee;
    } else {
        // If no employee, this is a global component
        queryConditions.employee = { $exists: false };  // Ensure it's a global component by excluding employee-specific ones
    }

    // Check if a component with the same name already exists, either globally or for this specific employee
    const existingSalaryComponent = await SalaryComponent.findOne(queryConditions);

    if (existingSalaryComponent) {
        return res.status(400).json({
            status: false,
            responseCode: '001',
            message: 'Salary component with the same name already exists.',
        });
    }

    if (!employee && String(calculationType).toUpperCase() === 'BALANCING') {
        const balancingError = await validateBalancingComponent({ corporateUserID });
        if (balancingError) {
            return res.status(400).json({
                status: false,
                responseCode: '001',
                message: balancingError,
            });
        }
    }

    let data = {
        ...sanitizeBody(req.body),
        ...(employee ? { employee } : {}),
        corporateUser: corporateUserID,
        isGlobal: !employee
    };
    // Create the new salary component
    const result = await createSalaryComponent(data);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Salary component created successfully",
        data: result,
    });
});



//get all salary components
exports.getAllSalaryComponents = asyncHandler(async (req, res, next) => {

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
    const type = req.query?.type || '';
    if (type !== 'setting') {
        await CorporateUser.findOneAndUpdate(
            {
                _id: corporateUserID,
                onboardStatus: { $lt: 2 }
            },
            // { _id: corporateUserID },
            { $set: { onboardStatus: 2 } },
            { new: true }
        );
        recalculateAndUpsertProgress(corporateUserID).catch(err =>
            console.error('[Progress] Failed to update progress:', err.message)
        );
    }
    const result = await getAllSalaryComponents(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching salary components', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Salary components fetched successfully',
        data: result
    });

})
//get employee salary components
exports.getEmployeeSalaryComponents = asyncHandler(async (req, res, next) => {

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

    const result = await getEmployeeSalaryComponents(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching salary components', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Salary components fetched successfully',
        data: result
    });

})
exports.getEmployeeSalaryComponentList = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const params = {
        corporateUserID,
        employeeId
    }; 

    const result = await getEmployeeSalaryComponentList(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching salary components', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Salary components fetched successfully',
        data: result
    });

})
// employee salary component with pagination
exports.getEmployeeSalaryComponentwithCount = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const searchText = req.query.searchText || '';
    const skip = (page - 1) * limit;
    const params = {
        corporateUserID,
        employeeId,
        page,
        limit,
        searchText,
        skip
    }; 

    const result = await getEmployeeSalaryComponentwithCount(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching salary components', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Salary components fetched successfully',
        data: result
    });

})
// get current component
exports.getCurrentComponent = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const params = {
        corporateUserID,
       
    }

    const result = await getCurrentComponent(params);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching salary components', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Salary components fetched successfully',
        data: result
    });

})
// get current employee component
exports.getCurrentEmployeeComponent = asyncHandler(async (req, res) => {

    
    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const params = {
        corporateUserID,
        employeeId
    }; 
    let result = await getCurrentEmployeeComponent(params);
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: "Salary component fetched successfully",
        data: result,
    });

})
// calculate salary component
exports.calculateSalaryComponent = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeId = req.params.id;
    const {grossSalary}=req.body
    const data = {
        corporateUserID,
        employeeId,
        grossSalary
    }; 

    const result = await calculateSalaryComponent(data);

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while calculating salary components', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Salary components calculated successfully',
        data: result
    });

})

//edit salary component
exports.editSalaryComponent = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    const componentId = req.params.id;
    const { employee } = req.body;
    const editData = sanitizeBody(req.body, ['isGlobal', 'globalComponentId']);

    let foundSalaryComponent = await SalaryComponent.findOne({
        _id: componentId,
        corporateUser: corporateUserID,
    });

    // componentId must be one of the caller's own components, and an employee from the
    // body must belong to the caller, before an override can be created/updated for it.
    if (!foundSalaryComponent || (employee && !(await isEmployeeOfCorporate(employee, corporateUserID)))) {
        return next(new ErrorResponse('Salary component data not found or unauthorized to edit', 400));
    }

    if (!employee) {
        const resultingCalculationType =
            editData.calculationType !== undefined ? editData.calculationType : foundSalaryComponent.calculationType;
        if (String(resultingCalculationType).toUpperCase() === 'BALANCING') {
            const balancingError = await validateBalancingComponent({
                corporateUserID,
                excludeComponentId: componentId,
            });
            if (balancingError) {
                return res.status(400).json({
                    status: false,
                    responseCode: '001',
                    message: balancingError,
                });
            }
        }
    }

    if (employee) {
        foundSalaryComponent = await SalaryComponent.findOne({
            _id: componentId,
            corporateUser: corporateUserID,
            employee: employee,
        });

        if (!foundSalaryComponent) {
            const newEmployeeSalaryComponent = await SalaryComponent.create({
                ...editData,
                globalComponentId:componentId,
                corporateUser: corporateUserID,
                employee: employee, 
                isGlobal: false, 
            });

            return res.status(201).json({
                status: true,
                responseCode: '000',
                message: 'Employee-specific salary component created successfully',
                data: newEmployeeSalaryComponent,
            });
        }
    }

    // If the component exists, either for the corporate or the employee, update the component
    foundSalaryComponent = await SalaryComponent.findOneAndUpdate(
        { _id: componentId, corporateUser: corporateUserID },
        { ...editData, employee: employee || foundSalaryComponent.employee },
        { new: true } // Return the updated document
    );

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Salary component data updated successfully',
        data: foundSalaryComponent,
    });
});

//delete salary component
exports.deleteSalaryComponent = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const componentId = req.params.id;

    const foundSalaryComponent = await SalaryComponent.findOne({
        _id: componentId,
        corporateUser: corporateUserID
    });
    if (!foundSalaryComponent) {
        return next(new ErrorResponse('Salary component not found or unauthorized to delete', 400));
    }

    const params = {
        corporateUserID,
        componentId
    }

    const result = await deleteSalaryComponent(params);

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Salary component deleted successfully',
        data: result
    });

})

//create employee salary component
// exports.createEmpSalaryComponent = asyncHandler(async (req, res, next) => {
//     const corporateUserID = req.user._id;
//     // const componentId = req.params.id;
//     const componentId = req.body.globalComponentId;
//     const id = req.body.id;
//     // const { employee, ...editData } = req.body;
//     const { employeeEmail,componentName, ...editData } = req.body;

//     let foundSalaryComponent = await SalaryComponent.findOne({
//         globalComponentId: componentId,
//         corporateUser: corporateUserID,
//         employeeEmail:employeeEmail
//     });

//     if (!foundSalaryComponent && !employeeEmail) {
//         return next(new ErrorResponse('Salary component data not found or unauthorized to edit', 400));
//     }

//     if (employeeEmail) {
//         foundSalaryComponent = await SalaryComponent.findOne({
//             globalComponentId: componentId,
//             corporateUser: corporateUserID,
//             employeeEmail,
//             componentName
//             // employee: employee,
//         });

//         if (!foundSalaryComponent) {
//             const newEmployeeSalaryComponent = await SalaryComponent.create({
//                 ...editData,
//                 employeeEmail:employeeEmail,
//                 componentName:componentName,
//                 // globalComponentId:componentId,
//                 corporateUser: corporateUserID,
//                 // employee: employee, 
//                 isGlobal: false, 
//             });

//             return res.status(201).json({
//                 status: true,
//                 responseCode: '000',
//                 message: 'Employee-specific salary component created successfully',
//                 data: newEmployeeSalaryComponent,
//             });
//         }
//     }

//     // If the component exists, either for the corporate or the employee, update the component
//     foundSalaryComponent = await SalaryComponent.findByIdAndUpdate(
//         id,
//         { ...editData, employeeEmail: employeeEmail || foundSalaryComponent.employee },
//         { new: true } // Return the updated document
//     );

//     return res.status(200).json({
//         status: true,
//         responseCode: '000',
//         message: 'Salary component data updated successfully',
//         data: foundSalaryComponent,
//     });
// });

// exports.createEmpSalaryComponent = asyncHandler(async (req, res, next) => {
//     const corporateUserID = req.user._id;
//     const componentId = req.body.globalComponentId;
//     const id = req.body.id;
//     const { employeeEmail, employee, componentName, ...editData } = req.body;
//     editData.globalComponentId = componentId === '' ? null : componentId;
//     // Determine the identifier: use employee if present, otherwise fall back to employeeEmail
//     const identifierField = employee ? 'employee' : 'employeeEmail';
//     const identifierValue = employee || employeeEmail;

//     if (!identifierValue) {
//         return next(new ErrorResponse('Employee identifier is required (employee or employeeEmail)', 400));
//     }
//     let query = {
//         corporateUser: corporateUserID,
//         [identifierField]: identifierValue
//     };

//     // Include globalComponentId only if it is present
//     if (componentId) {
//         query.globalComponentId = componentId;
//     }
//     let foundSalaryComponent = await SalaryComponent.findOne(query);
//     // let foundSalaryComponent = await SalaryComponent.findOne({
//     //     globalComponentId: componentId,
//     //     corporateUser: corporateUserID,
//     //     [identifierField]: identifierValue
//     // });

//     if (!foundSalaryComponent || !id ) {
//         // Try finding again with componentName
//         query.componentName = componentName;
//         foundSalaryComponent = await SalaryComponent.findOne(query)
//         // foundSalaryComponent = await SalaryComponent.findOne({
//         //     globalComponentId: componentId,
//         //     corporateUser: corporateUserID,
//         //     [identifierField]: identifierValue,
//         //     componentName
//         // });

//         if (!foundSalaryComponent || !id) {
//             let newEmployeeSalaryComponent;
//             if (identifierField === 'employeeEmail') {
//                 newEmployeeSalaryComponent = await SalaryComponent.findOneAndUpdate(
//                     {
//                         corporateUser: corporateUserID,
//                         componentName,
//                         employeeEmail,
//                         isGlobal: false
//                     },
//                     {
//                         $set: editData
//                     },
//                     {
//                         new: true
//                     }
//                 );
//             }
//             else{
//                 newEmployeeSalaryComponent = await SalaryComponent.create({
//                     ...editData,
//                     [identifierField]: identifierValue,
//                     componentName,
//                     corporateUser: corporateUserID,
//                     isGlobal: false
//                 });
//             }
//             ////////////////
//             // get salarycomponent assigned to particular email
//             if (identifierField === 'employee') {
//                 const employeeId = employee;
//                 const params = {
//                     corporateUserID,
//                     employeeId
//                 };

//                 const salComponentAssigedToEmail = await getEmployeeSalaryComponentList(params);
//                 // Loop through componentData and push formatted objects
//                 const salaryComponents = salComponentAssigedToEmail.componentData.map(component => ({
//                     component: component._id.toString(), // convert ObjectId to string
//                     type: component.isGlobal ? "DEFAULT" : "CUSTOM"
//                 }))
//                 const updatedEmployee = await Employee.findByIdAndUpdate(
//                     employee,
//                     { $set: { salaryComponents } },   // replace array
//                     { new: true }
//                 );
//             }
//             return res.status(201).json({
//                 status: true,
//                 responseCode: '000',
//                 message: 'Employee-specific salary component created successfully',
//                 data: newEmployeeSalaryComponent,
//             });
//         }
//     }

//     // If the component exists, update it
//     foundSalaryComponent = await SalaryComponent.findByIdAndUpdate(
//         id,
//         {
//             ...editData,
//             [identifierField]: identifierValue
//         },
//         { new: true }
//     );

//     return res.status(200).json({
//         status: true,
//         responseCode: '000',
//         message: 'Salary component data updated successfully',
//         data: foundSalaryComponent,
//     });
// });

exports.createEmpSalaryComponent = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;

    const {
        id,
        globalComponentId,
        employee,
        employeeEmail,
        componentName,
        ...rawEditData
    } = req.body;
    const editData = sanitizeBody(rawEditData, ['isGlobal']);

    // Decide identifier
    const identifierField = employee ? 'employee' : 'employeeEmail';
    const identifierValue = employee || employeeEmail;

    if (!identifierValue) {
        return next(
            new ErrorResponse(
                'Employee identifier is required (employee or employeeEmail)',
                400
            )
        );
    }

    if (employee && !(await isEmployeeOfCorporate(employee, corporateUserID))) {
        return next(new ErrorResponse('Employee not found', 404));
    }
    if (globalComponentId && !(await SalaryComponent.exists({ _id: globalComponentId, corporateUser: corporateUserID }))) {
        return next(new ErrorResponse('Salary component not found', 404));
    }

    /**
     * =====================================================
     * 1️⃣ CASE: globalComponentId present → ALWAYS CREATE
     * =====================================================
     */
    if (globalComponentId) {
        const { error: balancingError, newBalancingAmount } = await validateFitsAvailableCtc({
            corporateUserID,
            employeeId: employee,
            componentData: { componentName, ...editData },
        });
        if (balancingError) {
            return res.status(400).json({ status: false, responseCode: '001', message: balancingError });
        }

        // A rule HR changed from the org default (e.g. Basic 40% of CTC during Add Employee)
        // must be marked as a deliberate override, or the initial-hire revision re-solves it
        // from the global template and resets it to org policy.
        const globalTemplates = await SalaryComponent.find({
            corporateUser: corporateUserID,
            employee: null,
            isGlobal: true,
            status: 'ACTIVE',
        }).lean();
        const globalComponentsById = new Map(globalTemplates.map((t) => [t._id.toString(), t]));
        const overridesGlobalRule = differsFromGlobalRule(
            editData,
            globalComponentsById.get(String(globalComponentId)),
            globalComponentsById
        );

        const newComponent = await SalaryComponent.create({
            ...editData,
            componentName,
            globalComponentId,
            corporateUser: corporateUserID,
            [identifierField]: identifierValue,
            isGlobal: false,
            overridesGlobalRule,
        });
        await rebalanceComponent({ corporateUserID, employeeId: employee, newBalancingAmount });

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Employee salary component created successfully',
            data: newComponent
        });
    }

    /**
     * =====================================================
     * 2️⃣ CASE: id present → UPDATE if found else CREATE
     * =====================================================
     */
    if (id) {
        const existingComponent = await SalaryComponent.findOne({
            _id: id,
            corporateUser: corporateUserID,
            componentName,
            [identifierField]: identifierValue
        });

        if (existingComponent) {
            const { error: balancingError, newBalancingAmount } = await validateFitsAvailableCtc({
                corporateUserID,
                employeeId: employee,
                componentData: { componentName, ...editData },
                excludeComponentId: id,
            });
            if (balancingError) {
                return res.status(400).json({ status: false, responseCode: '001', message: balancingError });
            }

            const updatedComponent = await SalaryComponent.findOneAndUpdate(
                { _id: id, corporateUser: corporateUserID },
                {
                    ...editData
                },
                { new: true }
            );
            await rebalanceComponent({ corporateUserID, employeeId: employee, newBalancingAmount });

            return res.status(200).json({
                status: true,
                responseCode: '000',
                message: 'Employee salary component updated successfully',
                data: updatedComponent
            });
        }

        const { error: balancingErrorOnCreate, newBalancingAmount: newBalancingAmountOnCreate } = await validateFitsAvailableCtc({
            corporateUserID,
            employeeId: employee,
            componentData: { componentName, ...editData },
        });
        if (balancingErrorOnCreate) {
            return res.status(400).json({ status: false, responseCode: '001', message: balancingErrorOnCreate });
        }

        // id provided but no match → CREATE NEW
        const newComponent = await SalaryComponent.create({
            ...editData,
            componentName,
            corporateUser: corporateUserID,
            [identifierField]: identifierValue,
            isGlobal: false
        });
        await rebalanceComponent({ corporateUserID, employeeId: employee, newBalancingAmount: newBalancingAmountOnCreate });

        return res.status(201).json({
            status: true,
            responseCode: '000',
            message: 'Employee salary component created successfully',
            data: newComponent
        });
    }

    /**
     * =====================================================
     * 3️⃣ CASE: no id & no globalComponentId → CREATE
     * =====================================================
     */
    // A standalone employee component (no globalComponentId) has nothing to dedupe
    // against on read — mergeGlobalAndEmployeeComponents only skips a global component
    // when an employee override actually references its globalComponentId, so a
    // same-named standalone component just renders as a second row alongside it. Block
    // that here, checking both this employee's own components and the org's global ones.
    const duplicateComponent = await SalaryComponent.findOne({
        corporateUser: corporateUserID,
        componentName: { $regex: `^${escapeRegex(componentName)}$`, $options: 'i' },
        status: 'ACTIVE',
        $or: [{ [identifierField]: identifierValue }, { isGlobal: true }],
    });
    if (duplicateComponent) {
        return next(new ErrorResponse(`A salary component named "${componentName}" already exists.`, 400));
    }

    const { error: balancingError, newBalancingAmount } = await validateFitsAvailableCtc({
        corporateUserID,
        employeeId: employee,
        componentData: { componentName, ...editData },
    });
    if (balancingError) {
        return res.status(400).json({ status: false, responseCode: '001', message: balancingError });
    }

    const newComponent = await SalaryComponent.create({
        ...editData,
        componentName,
        corporateUser: corporateUserID,
        [identifierField]: identifierValue,
        isGlobal: false
    });
    await rebalanceComponent({ corporateUserID, employeeId: employee, newBalancingAmount });

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Employee salary component created successfully',
        data: newComponent
    });
});


exports.getEmployeeSalaryComponentListByEmail = asyncHandler(async (req, res, next) => {

    const corporateUserID = req.user._id;
    const employeeEmail = req.params.emailId;
    const params = {
        corporateUserID,
        employeeEmail,
        unassignedOnly: req.query.unassignedOnly === 'true',
        employeeId: req.query.employeeId,
    };

    const result = await getEmployeeSalaryComponentListByEmail(params);
    // const salaryComponents = result?.componentData || [];

    // ✅ Find Basic Salary
    // const basicSalaryComponent = salaryComponents.find(
    //     item => item.componentName === "Basic Salary"
    // );

    // const basicSalary = Number(basicSalaryComponent?.calculatedAmount || 0);
    // const getDeduction = await getEmployeeDeductionComponentListByEmail({ ...params, basicSalary });

    if (result.errors) {
        return next(new ErrorResponse('something went wrong while fetching salary components', 400));
    }

    return res.status(201).json({
        status: true,
        responseCode: '000',
        message: 'Salary components fetched successfully',
        data: result,
        // data: {...result,totalDeduction:getDeduction?.totalDeduction ?? 0},
    });

})

exports.redistributeBasicSalaryController = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    const { employeeId } = req.params;
    const { calculationType, amountPercentage, calculationBasis } = req.body;

    if (calculationType !== 'FIXED' && calculationType !== 'PERCENTAGE') {
        return next(new ErrorResponse('calculationType must be FIXED or PERCENTAGE', 400));
    }
    if (amountPercentage === undefined || amountPercentage === null || isNaN(Number(amountPercentage))) {
        return next(new ErrorResponse('amountPercentage is required and must be a number', 400));
    }
    // Omitted = "% of Gross", this endpoint's original behavior.
    if (calculationBasis !== undefined && calculationBasis !== 'GROSS_SALARY' && calculationBasis !== 'CTC') {
        return next(new ErrorResponse('calculationBasis must be GROSS_SALARY or CTC', 400));
    }

    try {
        const result = await redistributeBasicSalary({
            corporateUserID,
            employeeId,
            calculationType,
            amountPercentage: Number(amountPercentage),
            calculationBasis: calculationBasis || 'GROSS_SALARY',
        });

        logAudit({
            corporateUserID,
            actorId: req.user._id,
            actorRole: req.user.role,
            action: 'REDISTRIBUTE_BASIC_SALARY',
            entity: 'SalaryComponent',
            employeeId,
            metadata: { calculationType, amountPercentage: Number(amountPercentage), calculationBasis: calculationBasis || 'GROSS_SALARY' },
        });

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Basic Salary updated successfully',
            data: result,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message || 'Failed to update Basic Salary', 400));
    }
});

exports.redistributeEarningComponentController = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    const { employeeId } = req.params;
    const { componentId, calculationType, amountPercentage, calculationBasis } = req.body;

    if (!componentId) {
        return next(new ErrorResponse('componentId is required', 400));
    }
    if (calculationType !== 'FIXED' && calculationType !== 'PERCENTAGE') {
        return next(new ErrorResponse('calculationType must be FIXED or PERCENTAGE', 400));
    }
    if (amountPercentage === undefined || amountPercentage === null || isNaN(Number(amountPercentage))) {
        return next(new ErrorResponse('amountPercentage is required and must be a number', 400));
    }
    // Defaults to BASIC_SALARY when a percentage caller doesn't specify one, matching
    // this endpoint's original (Basic-only) behavior — see redistributeEarningComponent's
    // own comment for why a percentage component's basis (Gross vs Basic) has to be
    // resolved here rather than always forced to one or the other.
    if (
        calculationType === 'PERCENTAGE' &&
        calculationBasis !== undefined &&
        calculationBasis !== 'GROSS_SALARY' &&
        calculationBasis !== 'BASIC_SALARY' &&
        calculationBasis !== 'CTC'
    ) {
        return next(new ErrorResponse('calculationBasis must be GROSS_SALARY, BASIC_SALARY or CTC', 400));
    }

    try {
        const result = await redistributeEarningComponent({
            corporateUserID,
            employeeId,
            componentId,
            calculationType,
            amountPercentage: Number(amountPercentage),
            calculationBasis: calculationType === 'PERCENTAGE' ? (calculationBasis || 'BASIC_SALARY') : undefined,
        });

        logAudit({
            corporateUserID,
            actorId: req.user._id,
            actorRole: req.user.role,
            action: 'REDISTRIBUTE_EARNING_COMPONENT',
            entity: 'SalaryComponent',
            employeeId,
            metadata: { componentId, calculationType, amountPercentage: Number(amountPercentage), calculationBasis },
        });

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Component updated successfully',
            data: result,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message || 'Failed to update component', 400));
    }
});

exports.reviseSalaryController = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    const { employeeId } = req.params;
    const { newAnnualCTC, effectiveMonth, effectiveYear, reason, isInitialHire } = req.body;

    if (newAnnualCTC === undefined || newAnnualCTC === null || isNaN(Number(newAnnualCTC))) {
        return next(new ErrorResponse('newAnnualCTC is required and must be a number', 400));
    }
    if (!effectiveMonth || !effectiveYear) {
        return next(new ErrorResponse('effectiveMonth and effectiveYear are required', 400));
    }

    try {
        const result = await reviseSalary({
            corporateUserID,
            employeeId,
            newAnnualCTC: Number(newAnnualCTC),
            effectiveMonth: Number(effectiveMonth),
            effectiveYear: Number(effectiveYear),
            reason,
            createdBy: req.user?.name || req.user?.email || null,
            isInitialHire: !!isInitialHire,
        });

        logAudit({
            corporateUserID,
            actorId: req.user._id,
            actorRole: req.user.role,
            action: 'REVISE_SALARY',
            entity: 'SalaryStructureVersion',
            entityId: result.version?._id,
            employeeId,
            metadata: { newAnnualCTC: Number(newAnnualCTC), effectiveMonth: Number(effectiveMonth), effectiveYear: Number(effectiveYear) },
        });

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Salary revised successfully',
            data: result,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message || 'Failed to revise salary', 400));
    }
});

exports.getRevisionHistoryController = asyncHandler(async (req, res) => {
    const corporateUserID = req.user._id;
    const { employeeId } = req.params;

    // createdAt tiebreaker matches every other "current version" lookup (ctcCalculator.js,
    // salaryComponent.js's payroll-processing path) — two versions can share the same
    // effectiveFrom (both truncated to the 1st of the same month), and without it they'd
    // list in an arbitrary order instead of most-recently-made first.
    const versions = await SalaryStructureVersion.find({ corporateUser: corporateUserID, employee: employeeId })
        .populate('arrears')
        .sort({ effectiveFrom: -1, createdAt: -1 });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Revision history fetched successfully',
        data: versions,
    });
});

exports.undoLatestRevisionController = asyncHandler(async (req, res, next) => {
    const corporateUserID = req.user._id;
    const { employeeId } = req.params;

    try {
        const result = await undoLatestRevision({ corporateUserID, employeeId });

        logAudit({
            corporateUserID,
            actorId: req.user._id,
            actorRole: req.user.role,
            action: 'UNDO_REVISE_SALARY',
            entity: 'SalaryStructureVersion',
            employeeId,
        });

        return res.status(200).json({
            status: true,
            responseCode: '000',
            message: 'Revision undone successfully',
            data: result,
        });
    } catch (error) {
        return next(new ErrorResponse(error.message || 'Failed to undo revision', 400));
    }
});