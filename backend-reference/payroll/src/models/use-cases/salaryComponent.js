const mongoose = require('mongoose');
const SalaryComponent = require("../entities/salaryComponent");
const asyncHandler = require("../../middleware/async");
const {defaultSalaryComponents} = require('../../utils/defaultSalaryComponents');
const DeductionComponent = require("../entities/deductionComponent");
const Bonus = require("../entities/bonus");
const OverTime = require("../entities/overTime");
const Salary = require("../entities/salary");
const Incentives = require("../entities/incentives");
const ComplianceSettings = require("../entities/complianceSettings");
const { resolveEpfPolicyFromComplianceSettings, resolvePfMonthlyCap, isEpfApplicableForPeriod, capPfAmount } = require("../../services/calculateEmployerPf");
const SalaryStructureVersion = require("../entities/salaryStructureVersion");
const Employee = require("../entities/employee");
const {
  mergeGlobalAndEmployeeComponents,
  resolveEarnings,
  effectiveRule,
  findGlobalTemplate,
  isBalancingComponent,
  isBasicSalaryCompliant,
} = require("./mergeComponents");
const { ensureProvidentFundDeductionExists } = require('./complianceSettings');
const { markSalaryStale } = require('../../services/salaryStaleMarker');
const moment = require('moment');
const { escapeSearch } = require('../../utils/escapeRegex');

// Statutory EPF ceiling: employer/employee PF contribution is capped at 12% of the
// ₹15,000 EPF wage ceiling (i.e. ₹1,800/month), even when the employee's actual basic
// salary is higher.
const PF_MONTHLY_CAP = 1800;
const isProvidentFundDeduction = (deductionName) => deductionName === 'Provident Fund (PF)';
const roundToPaise = (value) => Math.round((Number(value) || 0) * 100) / 100;
exports.PF_MONTHLY_CAP = PF_MONTHLY_CAP;
exports.isProvidentFundDeduction = isProvidentFundDeduction;

exports.createSalaryComponent = async (data) => {
    try {
        const newSalaryComponent = new SalaryComponent(data);
        const savedSalaryComponent = await newSalaryComponent.save();
        return savedSalaryComponent;

    } catch (error) {
        console.log(error);
        return error;
    }
};

exports.getAllSalaryComponents = asyncHandler(async (params) => {
  try {
    let page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const searchText = params.searchText || '';
    let skip = (page - 1) * limit;

    // Provident Fund (PF) is a default deduction component just like Basic Salary/HRA are
    // default earnings — it should exist as soon as the org's default salary structure
    // does. Called unconditionally (idempotent findOne-then-create, same pattern already
    // used by ctcCalculator.js/bulkEmployeeCtc.js) rather than only inside the "seed
    // defaults for a brand-new org" branch below, so an org whose salary components were
    // already seeded before this fix existed also gets its PF row backfilled here instead
    // of staying silently missing forever.
    await ensureProvidentFundDeductionExists(params.corporateUserID);

    const baseConditions = {
      corporateUser: params.corporateUserID,
      isGlobal: true,
    };
    let queryConditions = baseConditions;

    queryConditions = {
       ...baseConditions,
      $or: [
        { componentName: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
        { category: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
        { calculationType: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
        { status: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
      ]
    };
    const priorityOrder = [
      'Basic Salary',
      'House Rent Allowance',
    ];
    let componentData = await SalaryComponent.find(queryConditions)
      .skip(skip)
      .limit(limit)
      .exec();
    componentData.sort((a, b) => {
      const indexA = priorityOrder.indexOf(a.componentName);
      const indexB = priorityOrder.indexOf(b.componentName);

      // If not found, push to end
      const orderA = indexA === -1 ? Infinity : indexA;
      const orderB = indexB === -1 ? Infinity : indexB;

      return orderA - orderB;
    });  
    
    if (componentData.length === 0) {
      const defaultComponents = defaultSalaryComponents(params.corporateUserID);
      for (const comp of defaultComponents) {
        await SalaryComponent.updateOne(
          {
            corporateUser: params.corporateUserID,
            componentName: comp.componentName,
            isGlobal: true,
          },
          { $setOnInsert: comp },
          { upsert: true }
        );
      }
      await markSalaryStale({
        corporateUserID: params.corporateUserID,
        reason: 'Default salary components seeded',
      });
      page = 1;
      skip = 0;
      
      componentData = await SalaryComponent.find(queryConditions)
        .skip(skip)
        .limit(limit).exec();

      componentData.sort((a, b) => {
        const indexA = priorityOrder.indexOf(a.componentName);
        const indexB = priorityOrder.indexOf(b.componentName);

        const orderA = indexA === -1 ? Infinity : indexA;
        const orderB = indexB === -1 ? Infinity : indexB;

        return orderA - orderB;
      });
      // componentData = await SalaryComponent.insertMany(defaultComponents);
    }

    const totalCount = await SalaryComponent.countDocuments(queryConditions);

    return {
      totalCount,
      componentData
    };


  } catch (error) {
    return error;
  }
});

exports.getEmployeeSalaryComponents = asyncHandler(async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            $or: [
                { componentName: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                { category: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                { calculationType: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                { status: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
            ]
        };

       

        const componentData = await SalaryComponent.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await SalaryComponent.countDocuments(queryConditions);
        return {
            totalCount,
            componentData

        }
    } catch (error) {
        return (error);
    }
});



exports.getEmployeeSalaryComponentList =asyncHandler(async (params) => {
  try {
     
      const queryConditions = {
          corporateUser: params.corporateUserID,
          employee: params.employeeId,
          isGlobal:false
      };

    
      const globalComponentData = await SalaryComponent.find({
          corporateUser: params.corporateUserID,
          employee: null,
          isGlobal:true,
          status:"ACTIVE"
      });

      console.log("global component data",globalComponentData)

      const employeeComponentData = await SalaryComponent.find(queryConditions);

      const overriddenGlobalIds = new Set(
        employeeComponentData
          .filter(item => item.globalComponentId)
          .map(item => item.globalComponentId.toString())
      );
      // Self-healing fallback for an override created before it was ever linked to its
      // global template (globalComponentId still null) — without this, that template
      // never gets excluded below, so the same component shows up twice: once as the
      // org default, once as the employee's own override.
      const overriddenGlobalNames = new Set(
        employeeComponentData
          .filter(item => !item.globalComponentId && item.componentName)
          .map(item => item.componentName.trim().toLowerCase())
      );

      // Filter global components to exclude overridden ones
      const filteredGlobalComponents = globalComponentData.filter(
        item =>
          !overriddenGlobalIds.has(item._id.toString()) &&
          !overriddenGlobalNames.has((item.componentName || '').trim().toLowerCase())
      );

      // Combine the result
      const combinedComponentData = [...filteredGlobalComponents, ...employeeComponentData];

      return {
        componentData: combinedComponentData,
      };

    //   const combinedComponentData = [...globalComponentData, ...employeeComponentData];
    //   console.log("===========combinedComponentData===============")
    //   console.log(combinedComponentData)
    //   console.log("===========combinedComponentData===============")
    //   return {
    //     componentData: combinedComponentData,
    // };

      // const employeeComponentMap = new Map(
      //     employeeComponentData
      //         .filter(component => component.globalComponentId)
      //         .map(component => [component.globalComponentId.toString(), component])
      // );

      // const combinedComponentData = globalComponentData.map(globalComponent => {
      //     const overriddenComponent = employeeComponentMap.get(globalComponent._id.toString());

      //     return overriddenComponent || globalComponent;
      // });
      // const uniqueEmployeeComponents = employeeComponentData.filter(component => !component.globalComponentId);
      // combinedComponentData.push(...uniqueEmployeeComponents);

      // return {
      //     componentData: combinedComponentData,
      // };
  } catch (error) {
      return error;
  }
});
exports.getEmployeeSalaryComponentwithCount = asyncHandler(async (params) => {
  try {
    // Pagination setup
    const page = parseInt(params.page) || 1;
    const limit = parseInt(params.limit) || 10;
    const skip = (page - 1) * limit;
    const searchText = params.searchText || '';

    // Fetch and calculate salary components
    const { combinedComponentData, grossSalary, totalEarnings, basicSalary } = await fetchAndCalculateSalaryComponents({
      corporateUserID: params.corporateUserID,
      employeeId: params.employeeId,
      searchText,
    });

    // Apply pagination to the combined component data
    const paginatedComponentData = combinedComponentData.slice(skip, skip + limit);
    const grossSalaryWithBonus = await calculateBonusIncentivesOvertime({
      corporateUserID: params.corporateUserID,
      employeeId: params.employeeId,
    })
    const extraEarnings = Number(grossSalaryWithBonus?.totalExtraEarnings || 0)
    // Total count of all components (before pagination)
    const totalCount = combinedComponentData.length;
     return {
      componentData: paginatedComponentData,
      totalCount,
      grossSalary: parseFloat((grossSalary + extraEarnings).toFixed(2)), // Return the gross salary
      // Sum of all ACTIVE earning components (Basic + allowances etc.), before deductions/bonus —
      // what the "Total Earnings" figure on the salary components tab should show.
      totalEarnings: parseFloat(totalEarnings.toFixed(2)),
      basicSalary, // Optionally return the basic salary
    };
  } catch (error) {
    return error;
  }

    // Query conditions for employee-specific components
    // const queryConditions = {
    //   corporateUser: params.corporateUserID,
    //   employee: params.employeeId,
    //   $or: [
    //     { componentName: { $regex: searchText, $options: 'i' } },
    //     { category: { $regex: searchText, $options: 'i' } },
    //     { calculationType: { $regex: searchText, $options: 'i' } },
    //     { status: { $regex: searchText, $options: 'i' } },
    //   ],
    // };

    // Fetch global components with search functionality
    // const globalComponentData = await SalaryComponent.find({
    //   corporateUser: params.corporateUserID,
    //   employee: null,
    //   isGlobal: true,
    //   $or: [
    //     { componentName: { $regex: searchText, $options: 'i' } },
    //     { category: { $regex: searchText, $options: 'i' } },
    //     { calculationType: { $regex: searchText, $options: 'i' } },
    //     { status: { $regex: searchText, $options: 'i' } },
    //   ],
    // });

    // Fetch employee-specific components with search functionality
    // const employeeComponentData = await SalaryComponent.find(queryConditions);

    // Map employee-specific components to override global components if necessary
    // const employeeComponentMap = new Map(
    //   employeeComponentData
    //     .filter((component) => component.globalComponentId)
    //     .map((component) => [component.globalComponentId.toString(), component])
    // );

    // const combinedComponentData = globalComponentData.map((globalComponent) => {
    //   const overriddenComponent = employeeComponentMap.get(globalComponent._id.toString());
    //   return overriddenComponent || globalComponent;
    // });

    // Add employee-specific components that don't override global ones
    // const uniqueEmployeeComponents = employeeComponentData.filter((component) => !component.globalComponentId);
    // combinedComponentData.push(...uniqueEmployeeComponents);

    // // Extract the basic salary from the component list
    // const basicSalary = combinedComponentData.find(
    //   ({ componentName, calculationType }) =>
    //     componentName === 'Basic Salary' && calculationType === 'FIXED'
    // )?.amountPercentage || 0;

    // Calculate gross salary
    // const grossSalary = combinedComponentData.reduce((total, { calculationType, amountPercentage = 0 }) => {
    //   if (calculationType === 'FIXED') return total + amountPercentage;
    //   if (calculationType === 'PERCENTAGE') return total + (amountPercentage / 100) * basicSalary;
    //   return total;
    // }, 0);

    // const grossSalary = combinedComponentData.reduce((total, component) => {
    //   return total + (component.amountPercentage || 0); // Ensure to handle missing or undefined amounts
    // }, 0);

    // Apply pagination to the combined component data
    // const paginatedComponentData = combinedComponentData.slice(skip, skip + limit);

    // Total count of all components (before pagination)
    // const totalCount = combinedComponentData.length;

  //   return {
  //     componentData: paginatedComponentData,
  //     totalCount,
  //     grossSalary, // Return the gross salary
  //   };
  // } catch (error) {
  //   return error;
  // }
});
// current employee salary component
exports.getCurrentEmployeeComponent = asyncHandler(async (params) => {
  try {
    const queryConditions = {
      corporateUser: params.corporateUserID,
      employee: params.employeeId,
    };

    // Fetch global components and employee-specific components
    const globalComponentData = await SalaryComponent.find({
      corporateUser: params.corporateUserID,
      employee: null,
      isGlobal: true,
    });

    const employeeComponentData = await SalaryComponent.find(queryConditions);

    // Create a map of employee-specific components that override global components
    const employeeComponentMap = new Map(
      employeeComponentData
        .filter((component) => component.globalComponentId)
        .map((component) => [component.globalComponentId.toString(), component])
    );

    // Combine global and overridden employee components
    const combinedComponentData = globalComponentData.map((globalComponent) => {
      const overriddenComponent = employeeComponentMap.get(globalComponent._id.toString());
      return overriddenComponent || globalComponent;
    });

    // Add unique employee-specific components that don't override global ones
    const uniqueEmployeeComponents = employeeComponentData.filter(
      (component) => !component.globalComponentId
    );
    combinedComponentData.push(...uniqueEmployeeComponents);

    // Add the additional component for "Gross Salary"
    // combinedComponentData.push({
    //   componentName: 'Gross Salary',
    //   id: 'GROSS_SALARY',
    // });

    return {
      componentData: combinedComponentData,
    };
  } catch (error) {
    return error;
  }
});

// current salary component
exports.getCurrentComponent = asyncHandler(async (params) => {
  try {
    // Same reasoning as getAllSalaryComponents above — PF is a default deduction
    // component just like Basic Salary/HRA are default earnings, so it should exist
    // whenever the org's global salary structure is read, whether that's a brand-new org
    // seeding defaults for the first time or an existing org backfilling its PF row.
    await ensureProvidentFundDeductionExists(params.corporateUserID);

    const queryConditions = {
      corporateUser: params.corporateUserID,
      isGlobal: true,
      $or: [
        { employee: null },
        { employee: { $exists: false } }
      ],
    };

    let componentData = await SalaryComponent.find(queryConditions);

    if (componentData.length === 0) {
      const defaults = defaultSalaryComponents(params.corporateUserID);

      await Promise.all(
        defaults.map(comp =>
          SalaryComponent.updateOne(
            {
              corporateUser: params.corporateUserID,
              componentName: comp.componentName,
              isGlobal: true,
            },
            { $setOnInsert: comp },
            { upsert: true }
          )
        )
      );
      await markSalaryStale({
        corporateUserID: params.corporateUserID,
        reason: 'Default salary components seeded',
      });

      componentData = await SalaryComponent.find(queryConditions);
    }

    // componentData.push({
    //   componentName: 'Gross Salary',
    //   id: 'GROSS_SALARY',
    // });

    return { componentData };
  } catch (error) {
    return error;
  }
});


//calculate salary component
exports.calculateSalaryComponent =asyncHandler(async (params) => {
  try {
      const queryConditions = {
          corporateUser: params.corporateUserID,
          employee: params.employeeId,
      };

    
      const globalComponentData = await SalaryComponent.find({
          corporateUser: params.corporateUserID,
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

      return {
          componentData: combinedComponentData,
      };
  } catch (error) {
      return error;
  }
});
  
  

exports.editSalaryComponent = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const componentId = params.componentId;
        const editData = params.editData

        const query = {
            _id: componentId,
            corporateUser: corporateUserID
        }
        const editSalaryComponent = await SalaryComponent.updateOne(query, editData);

        return editSalaryComponent;

    } catch (error) {
        return error
    }
});
exports.deleteSalaryComponent = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const componentId = params.componentId;

        const deleteSalaryComponent = await SalaryComponent.findOneAndDelete({
            _id: componentId,
            corporateUser: corporateUserID
        });

        return deleteSalaryComponent;

    } catch (error) {
        return error
    }
});

exports.getEmployeeSalaryComponentListByEmail =asyncHandler(async (params) => {
  try {
      // This is what Add Employee/New Hire's Salary Information step reads to seed its
      // starting earnings — PF is a default deduction component just like Basic Salary/HRA
      // are default earnings, so ensure it exists here too (idempotent), or a hire started
      // before the org's global PF row existed would show no PF deduction at all in the CTC
      // preview even though real payroll always calculates it correctly regardless.
      await ensureProvidentFundDeductionExists(params.corporateUserID);

      const queryConditions = {
          corporateUser: params.corporateUserID,
          employeeEmail: params.employeeEmail,
          isGlobal:false
      };
      // A rehire reuses a past employee's email, so email alone also matches the components of
      // the earlier record. Creating an employee takes only components not yet linked to one;
      // a caller viewing an existing employee passes its id.
      if (params.unassignedOnly) {
          queryConditions.employee = null;
      } else if (params.employeeId) {
          queryConditions.employee = { $in: [null, params.employeeId] };
      }

    
      const globalComponentData = await SalaryComponent.find({
          corporateUser: params.corporateUserID,
          employee: null,
          isGlobal:true,
          status:"ACTIVE"
      });

      console.log("global component data",globalComponentData)

      const employeeComponentData = await SalaryComponent.find(queryConditions);

      const overriddenGlobalIds = new Set(
        employeeComponentData
          .filter(item => item.globalComponentId)
          .map(item => item.globalComponentId.toString())
      );
      // Self-healing fallback for an override created before it was ever linked to its
      // global template (globalComponentId still null) — see getEmployeeSalaryComponentList
      // above for the full rationale.
      const overriddenGlobalNames = new Set(
        employeeComponentData
          .filter(item => !item.globalComponentId && item.componentName)
          .map(item => item.componentName.trim().toLowerCase())
      );

      // Filter global components to exclude overridden ones
      const filteredGlobalComponents = globalComponentData.filter(
        item =>
          !overriddenGlobalIds.has(item._id.toString()) &&
          !overriddenGlobalNames.has((item.componentName || '').trim().toLowerCase())
      );

      // Combine the result
      const combinedComponentData = [...filteredGlobalComponents, ...employeeComponentData];

      // A component with calculationBasis: 'COMPONENT' (e.g. HRA configured at the org
      // level as "50% of [Basic Salary]", via Payroll Settings > Salary Components) stores
      // calculationBasedOn as that referenced GLOBAL template's own id. Once Basic Salary
      // itself has an employee override, its global row is filtered out above — leaving
      // HRA's calculationBasedOn pointing at an id that's no longer anywhere in
      // combinedComponentData, so resolveEarnings below can't find it and silently resolves
      // HRA to 0 even though Basic Salary itself resolves correctly. Rewriting the
      // reference to the override that took its place keeps it resolvable.
      const replacementIdByFilteredGlobalId = new Map();
      globalComponentData.forEach(globalComponent => {
        const replacement =
          employeeComponentData.find(
            item => item.globalComponentId?.toString() === globalComponent._id.toString()
          ) ||
          employeeComponentData.find(
            item =>
              !item.globalComponentId &&
              item.componentName?.trim().toLowerCase() ===
                (globalComponent.componentName || '').trim().toLowerCase()
          );
        if (replacement) {
          replacementIdByFilteredGlobalId.set(globalComponent._id.toString(), replacement._id.toString());
        }
      });
      combinedComponentData.forEach(component => {
        const currentBasedOn = component.calculationBasedOn?.toString();
        if (currentBasedOn && replacementIdByFilteredGlobalId.has(currentBasedOn)) {
          component.calculationBasedOn = replacementIdByFilteredGlobalId.get(currentBasedOn);
        }
      });

      // Same pinning as getAllSalaryComponents above — Basic Salary and HRA first,
      // everything else keeps its existing relative order (stable sort).
      const earningsPriorityOrder = ['Basic Salary', 'House Rent Allowance'];
      combinedComponentData.sort((a, b) => {
        const orderA = earningsPriorityOrder.indexOf(a.componentName);
        const orderB = earningsPriorityOrder.indexOf(b.componentName);
        return (orderA === -1 ? Infinity : orderA) - (orderB === -1 ? Infinity : orderB);
      });

      // ---- CALCULATOR ----
      // A brand-new hire's earnings are keyed by email rather than employeeId (no Employee
      // document exists yet), so this can't reuse mergeGlobalAndEmployeeComponents/an
      // employeeId-based CTC anchor — but it still needs to resolve amounts the same way
      // the rest of payroll does. The hand-rolled resolver this replaced only understood a
      // PERCENTAGE component whose calculationBasedOn pointed at ANOTHER component's exact
      // id, with no case at all for GROSS_SALARY/BASIC_SALARY-basis percentages or for
      // BALANCING — so Basic Salary ("50% of Gross Salary", calculationBasis: GROSS_SALARY,
      // no calculationBasedOn) and the Balancing/absorber component (e.g. "Other Allowance")
      // both silently fell through to its default `return 0`, regardless of what CTC was
      // entered — exactly the New Hire Profile's "Compensation shows ₹0 for everything" bug.
      // resolveEarnings (mergeComponents.js) is the same linear-algebra engine every other
      // earnings display in this codebase already uses — it understands
      // GROSS_SALARY/BASIC_SALARY/COMPONENT percentage bases and the Balancing role,
      // reading each employee override where one exists and falling back to the global
      // template's rule otherwise.
      const globalComponentsById = new Map(globalComponentData.map(comp => [comp._id.toString(), comp]));
      const { earnings, grossSalary } = resolveEarnings(combinedComponentData, globalComponentsById);
      const calculatedAmountByComponentId = new Map(earnings.map(e => [e.id, e.calculatedAmount]));
      const calculatedComponents = combinedComponentData.map(component => ({
        ...component.toObject(),
        calculatedAmount: calculatedAmountByComponentId.get(component._id.toString()) ?? 0
      }));

    return {
      componentData: calculatedComponents,
      // Surfaced so createEmployee/createNewHireEmployee can default enableESI from it —
      // this is the same gross salary resolveEarnings already computed above, previously
      // discarded.
      grossSalary
    };

    //   const combinedComponentData = [...globalComponentData, ...employeeComponentData];
    //   console.log("===========combinedComponentData===============")
    //   console.log(combinedComponentData)
    //   console.log("===========combinedComponentData===============")
    //   return {
    //     componentData: combinedComponentData,
    // };

      // const employeeComponentMap = new Map(
      //     employeeComponentData
      //         .filter(component => component.globalComponentId)
      //         .map(component => [component.globalComponentId.toString(), component])
      // );

      // const combinedComponentData = globalComponentData.map(globalComponent => {
      //     const overriddenComponent = employeeComponentMap.get(globalComponent._id.toString());

      //     return overriddenComponent || globalComponent;
      // });
      // const uniqueEmployeeComponents = employeeComponentData.filter(component => !component.globalComponentId);
      // combinedComponentData.push(...uniqueEmployeeComponents);

      // return {
      //     componentData: combinedComponentData,
      // };
  } catch (error) {
      return error;
  }
});  

exports.getEmployeeGrossSalary = asyncHandler(async (params) => {
  try {
    const searchText = params.searchText || '';
    // Fetch and calculate salary components
    const { grossSalary, totalEarnings, totalDeductions, basicSalary } = await fetchAndCalculateSalaryComponents({
      corporateUserID: params.corporateUserID,
      employeeId: params.employeeId,
      searchText,
    });

    return {
      grossSalary, // net salary (after deductions)
      totalEarnings, // pre-deduction gross (sum of salary components)
      totalDeductions, // sum of active deduction amounts
      basicSalary,
    };
  }
  catch (error) {
    return error;
  }
})

// Resolves a single deduction component's actual monthly rupee amount — same
// FIXED/PERCENTAGE + PF-cap logic used when computing the aggregate total, but for
// one component at a time (e.g. for per-row display in a deduction components list).
// pfPolicy: 'CAPPED_15000' (default — capped at the PERIOD's statutory PF wage ceiling,
// ₹15,000 through August 2026, ₹25,000 from September 2026) or 'FULL_BASIC' (org's
// Compliance Settings → EPF is set to "12% of Basic Salary", no cap).
// month/year: the payroll period this amount is FOR — omit only for a "right now" live
// preview (e.g. an unrelated component list view); a specific payroll run must always
// pass its own month/year so a historical month keeps its historical ceiling.
// Defaults preserve exact existing behavior for any caller that doesn't pass pfPolicy.
exports.calculateSingleDeductionAmount = ({
  calculationType,
  amountPercentage = 0,
  calculationBasis,
  salaryDeductionType,
  deductionName,
  basicSalary = 0,
  grossSalaryBase = 0,
  pfPolicy = 'CAPPED_15000',
  month,
  year,
  // Set only on a PF deduction auto-frozen to FIXED the first time 12% of Basic exceeded
  // the statutory cap (see deductionComponent.js's one-time freeze) — never on a genuinely
  // bespoke, admin-set FIXED PF amount with no backing global template. Lets this self-heal
  // against the CURRENT period's ceiling instead of staying pinned at whatever rupee figure
  // was correct when it was frozen, potentially months or years before a ceiling change.
  globalComponentId,
}) => {
  const amount = Number(amountPercentage) || 0;
  if (calculationType === 'FIXED') {
    if (isProvidentFundDeduction(deductionName) && globalComponentId && pfPolicy !== 'FULL_BASIC') {
      return capPfAmount(basicSalary * 0.12, month, year);
    }
    return calculationBasis === 'YEARLY' ? amount / 12 : amount;
  }
  if (calculationType === 'PERCENTAGE') {
    const base = salaryDeductionType === 'GROSS_SALARY' ? grossSalaryBase : basicSalary;
    const raw = (amount / 100) * base;
    let monthly = calculationBasis === 'YEARLY' ? raw / 12 : raw;
    if (isProvidentFundDeduction(deductionName) && pfPolicy !== 'FULL_BASIC') {
      monthly = capPfAmount(monthly, month, year);
    }
    return monthly;
  }
  return 0;
};

async function fetchAndCalculateSalaryComponents({
  corporateUserID,
  employeeId,
  searchText
}) {
  try {
    // Query conditions for employee-specific components
    const queryConditions = {
      corporateUser: corporateUserID,
      employee: employeeId,
      $or: [
        { componentName: { $regex: escapeSearch(searchText), $options: 'i' } },
        { category: { $regex: escapeSearch(searchText), $options: 'i' } },
        { calculationType: { $regex: escapeSearch(searchText), $options: 'i' } },
        { status: { $regex: escapeSearch(searchText), $options: 'i' } },
      ],
    };

    // Fetch global components with search functionality
    const globalComponentData = await SalaryComponent.find({
      corporateUser: corporateUserID,
      employee: null,
      isGlobal: true,
      $or: [
        { componentName: { $regex: escapeSearch(searchText), $options: 'i' } },
        { category: { $regex: escapeSearch(searchText), $options: 'i' } },
        { calculationType: { $regex: escapeSearch(searchText), $options: 'i' } },
        { status: { $regex: escapeSearch(searchText), $options: 'i' } },
      ],
    });

    // Fetch employee-specific components with search functionality
    const employeeComponentData = await SalaryComponent.find(queryConditions);

    // Map employee-specific components to override global components if necessary
    const employeeComponentMap = new Map(
      employeeComponentData
        .filter((component) => component.globalComponentId)
        .map((component) => [component.globalComponentId.toString(), component])
    );

    // Combine global and employee-specific components
    const combinedComponentData = globalComponentData.map((globalComponent) => {
      const overriddenComponent = employeeComponentMap.get(globalComponent._id.toString());
      return overriddenComponent || globalComponent;
    });

    // Add employee-specific components that don't override global ones
    const uniqueEmployeeComponents = employeeComponentData.filter((component) => !component.globalComponentId);
    combinedComponentData.push(...uniqueEmployeeComponents);

    // Extract the basic salary from the component list
    const basicSalary = combinedComponentData.find(
      ({ componentName, calculationType }) =>
        componentName === 'Basic Salary' && calculationType === 'FIXED'
    )?.amountPercentage || 0;

   const componentMap = new Map();
combinedComponentData.forEach(comp => {
  componentMap.set(comp._id.toString(), { ...comp._doc, calculatedAmount: null });
});

    

    // 3. Define recursive calculation function
const calculateComponentAmount = (componentId) => {
  const component = componentMap.get(componentId);
  if (!component || component.status !== 'ACTIVE') return 0;

  if (component.calculatedAmount !== null) {
    return component.calculatedAmount;
  }

  let amount = 0;

  if (component.calculationType === 'FIXED') {
    amount = component.amountPercentage;
  }
  else if (component.calculationType === 'PERCENTAGE') {
    if (component.calculationBasis === 'BASIC_SALARY') {
      amount = (component.amountPercentage / 100) * basicSalary;
    } else if (component.calculationBasis === 'GROSS_SALARY') {
      // No independent Gross anchor in this general-purpose engine (Gross is the sum
      // being computed right now) — this basis is resolved by the CTC Calculator's own
      // reverse-solve instead. Real employees have this frozen to a FIXED override by
      // the time they're hired, so this branch is a safe, non-crashing fallback only.
      amount = 0;
    } else {
      // existing behavior: % of a specific other component (calculationBasedOn = id)
      const baseName = component.calculationBasedOn;
      const baseAmount = calculateComponentAmount(baseName);
      amount = (component.amountPercentage / 100) * baseAmount;
    }
  }
  else if (component.calculationType === 'BALANCING') {
    // Same reasoning as the GROSS_SALARY branch above — resolved by the CTC Calculator,
    // frozen to a FIXED amount for real employees at hire time.
    amount = 0;
  }

  component.calculatedAmount = amount;
  return amount;
};

 // Calculate gross salary using recursive function
    let grossSalary = 0;
    combinedComponentData.forEach(comp => {
      grossSalary += calculateComponentAmount(comp._id.toString());
    });

    const totalDeductionAmount = await fetchAndCalculateDeductionComponents({corporateUserID, employeeId, searchText,  basicSalary,grossSalaryAmount:grossSalary})
    const netSalary = grossSalary - totalDeductionAmount.grossSalary;
    return {
      combinedComponentData,
      grossSalary: netSalary,
      totalEarnings: grossSalary,
      // Sum of all active deduction amounts (monthly-normalized) — what the
      // "Total Deduction" figure on the deduction components tab should show.
      totalDeductions: totalDeductionAmount.grossSalary,
      basicSalary,
    };
  } catch (error) {
    throw new Error('Error in fetching and calculating salary components');
  }
}

async function fetchAndCalculateDeductionComponents({
  corporateUserID,
  employeeId,
  searchText,
  basicSalary,
  grossSalaryAmount=0
}) {
  try {
    const complianceSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });
    const pfPolicy = resolveEpfPolicyFromComplianceSettings(complianceSettings);
    // Query conditions for employee-specific components
    const queryConditions = {
      corporateUser: corporateUserID,
      employee: employeeId,
      $or: [
        { deductionName: { $regex: escapeSearch(searchText), $options: 'i' } },
        { category: { $regex: escapeSearch(searchText), $options: 'i' } },
        { calculationType: { $regex: escapeSearch(searchText), $options: 'i' } },
        { status: { $regex: escapeSearch(searchText), $options: 'i' } },
      ],
    };

    // Fetch global components with search functionality
    const globalComponentData = await DeductionComponent.find({
      corporateUser: corporateUserID,
      employee: null,
      isGlobal: true,
      $or: [
        { deductionName: { $regex: escapeSearch(searchText), $options: 'i' } },
        { category: { $regex: escapeSearch(searchText), $options: 'i' } },
        { calculationType: { $regex: escapeSearch(searchText), $options: 'i' } },
        { status: { $regex: escapeSearch(searchText), $options: 'i' } },
      ],
    });

    // Fetch employee-specific components with search functionality
    const employeeComponentData = await DeductionComponent.find(queryConditions);

    // Map employee-specific components to override global components if necessary
    const employeeComponentMap = new Map(
      employeeComponentData
        .filter((component) => component.globalComponentId)
        .map((component) => [component.globalComponentId.toString(), component])
    );

    // Combine global and employee-specific components
    const combinedComponentData = globalComponentData.map((globalComponent) => {
      const overriddenComponent = employeeComponentMap.get(globalComponent._id.toString());
      return overriddenComponent || globalComponent;
    });

    // Add employee-specific components that don't override global ones
    const uniqueEmployeeComponents = employeeComponentData.filter((component) => !component.globalComponentId);
    combinedComponentData.push(...uniqueEmployeeComponents);

    // Only ACTIVE rows should count toward the deduction total — this previously summed
    // every row regardless of status, so flipping a component to INACTIVE (e.g. via a
    // Statutory Components toggle) never actually changed the displayed total.
    // Establishment EPF switched off (current setting — this is a live view) drops PF too.
    const epfApplicable = isEpfApplicableForPeriod(complianceSettings);
    const activeComponentData = combinedComponentData.filter(
      (component) => component.status === 'ACTIVE' && (epfApplicable || !isProvidentFundDeduction(component.deductionName))
    );

    // Pass 1: calculate non-GROSS_SALARY deductions to find the adjusted gross base
    let nonGrossSalaryDeductions = 0;
    for (const { deductionName, calculationType, amountPercentage = 0, salaryDeductionType, calculationBasis, globalComponentId } of activeComponentData) {
      if (salaryDeductionType === 'GROSS_SALARY') continue;
      if (calculationType === 'FIXED') {
        // Self-heal an auto-frozen PF cap (see deductionComponent.js) against the
        // current ceiling instead of trusting a rupee figure frozen before a since-
        // changed ceiling — globalComponentId is only set on that kind of override.
        nonGrossSalaryDeductions +=
          isProvidentFundDeduction(deductionName) && globalComponentId && pfPolicy !== 'FULL_BASIC'
            ? Math.min((basicSalary * 12) / 100, resolvePfMonthlyCap())
            : (calculationBasis === 'YEARLY' ? amountPercentage / 12 : amountPercentage);
      } else if (calculationType === 'PERCENTAGE') {
        const raw = (amountPercentage / 100) * basicSalary;
        let monthlyDeduction = calculationBasis === 'YEARLY' ? raw / 12 : raw;
        if (isProvidentFundDeduction(deductionName) && pfPolicy !== 'FULL_BASIC') {
          // Live/current view (no specific payroll month in scope here) — capped at
          // whatever the ceiling is right now.
          monthlyDeduction = Math.min(monthlyDeduction, resolvePfMonthlyCap());
        }
        nonGrossSalaryDeductions += monthlyDeduction;
      }
    }

    // GROSS_SALARY base = totalEarnings minus non-GROSS_SALARY deductions
    const grossSalaryBase = grossSalaryAmount - nonGrossSalaryDeductions;

    // Pass 2: calculate all deductions (GROSS_SALARY type now uses adjusted base)
    let grossSalary = 0;
    for (const { deductionName, calculationType, amountPercentage = 0, salaryDeductionType, calculationBasis, globalComponentId } of activeComponentData) {
      if (calculationType === 'FIXED') {
        grossSalary +=
          isProvidentFundDeduction(deductionName) && globalComponentId && pfPolicy !== 'FULL_BASIC'
            ? Math.min((basicSalary * 12) / 100, resolvePfMonthlyCap())
            : (calculationBasis === 'YEARLY' ? amountPercentage / 12 : amountPercentage);
      } else if (calculationType === 'PERCENTAGE') {
        const base = salaryDeductionType === 'GROSS_SALARY' ? grossSalaryBase : basicSalary;
        const raw = (amountPercentage / 100) * base;
        let monthlyDeduction = calculationBasis === 'YEARLY' ? raw / 12 : raw;
        if (isProvidentFundDeduction(deductionName) && pfPolicy !== 'FULL_BASIC') {
          monthlyDeduction = Math.min(monthlyDeduction, resolvePfMonthlyCap());
        }
        grossSalary += monthlyDeduction;
      }
    }

    return { grossSalary, basicSalary };
  } catch (error) {
    throw new Error('Error in fetching and calculating salary components');
  }
}

// exports.getEmployeeSalaryComponentForProcessSalary =asyncHandler(async (params) => {
//  try {
//     const { corporateUserID, employeeId, year, month } = params;

//     // Fetch Salary & Deduction components in parallel
//     const [
//       salaryComponents,
//       deductionComponents,
//       bonusData
//     ] = await Promise.all([
//       getMergedComponents(SalaryComponent, corporateUserID, employeeId),
//       getMergedComponents(DeductionComponent, corporateUserID, employeeId),
//       // getBonusData({corporateUserID, employeeId, year, month})
//     ]);
//    const basicSalaryComponent = salaryComponents.find(
//      c => c.componentName === "Basic Salary"
//    );

//    const basicSalary = basicSalaryComponent
//      ? Number(basicSalaryComponent.amountPercentage)
//      : 0;

//    return {
//      salaryComponents: calculateComponentAmounts(salaryComponents, basicSalary),
//      deductionComponents: calculateComponentAmounts(deductionComponents, basicSalary)
//    };

//   } catch (error) {
//     console.log("Error fetching components:", error);
//     return {
//       error: true,
//       message: "Failed to load employee components",
//       details: error
//     };
//   }

// });

exports.getEmployeeSalaryComponentForProcessSalary = asyncHandler(async (params) => {
  try {
    const { corporateUserID, employeeId, year, month } = params;
    const endOfTargetMonth = moment({ year, month: month - 1 }).endOf("month").toDate();

    let [
      salaryComponents,
      deductionComponents,
      salaryData,
      structureVersion,
      globalEarningTemplates,
      employee,
      complianceSettings
    ] = await Promise.all([
      mergeGlobalAndEmployeeComponents(SalaryComponent, { corporateUserID, employeeId }),
      mergeGlobalAndEmployeeComponents(DeductionComponent, { corporateUserID, employeeId }),
      Salary.findOne({
        corporateUser: corporateUserID,
        employee: new mongoose.Types.ObjectId(employeeId),
        year: year,
        month: month
      }).lean(),
      // A Revise Salary that took effect on/before this month overrides live component
      // state for earnings — this is what makes past/future months resolve correctly
      // instead of always reading whatever is ACTIVE today. No version yet (the common
      // case until Revise Salary is actually used) falls through to live resolution below,
      // unchanged from today's behavior.
      // createdAt tiebreaker matches ctcCalculator.js's identical query — two versions can
      // share the same effectiveFrom (both truncated to the 1st of the same month, e.g. a
      // backfilled "Initial hire" version and a same-month Revise Salary), and without it
      // the "current" one was picked arbitrarily instead of the most recently created one,
      // silently re-solving payroll off a superseded CTC.
      SalaryStructureVersion.findOne({
        employee: employeeId,
        effectiveFrom: { $lte: endOfTargetMonth }
      }).sort({ effectiveFrom: -1, createdAt: -1 }).lean(),
      // Needed by resolveEarnings below to correctly solve PERCENTAGE-of-Gross/Basic
      // earnings (e.g. Basic "50% of Gross", HRA "50% of Basic") for an employee who's
      // never been through Revise Salary — bulk-uploaded employees in particular, whose
      // Basic amountPercentage genuinely holds a raw percent (not a frozen rupee value).
      SalaryComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }).lean(),
      // Needed to build the same esiContext getEmployeeCtcBreakdown passes into
      // solveEarningsForCtc below — see that context's construction for why omitting it
      // isn't actually a "minor display-precision tradeoff" (it was previously assumed to
      // be): without it, solveEarningsForCtc never nets employer ESI out of the target CTC,
      // so it solves for a HIGHER Gross Salary than the CTC tab does for the identical
      // committed CTC, which cascades into a wrong Balancing amount AND a wrong ESI
      // Employee deduction (0.75% of that inflated Gross) — a real, compounding mismatch
      // between this (payroll processing/"Upcoming" listing) and the Salary Structure tab.
      Employee.findById(employeeId).lean(),
      ComplianceSettings.findOne({ corporateUser: corporateUserID }).lean()
    ]);

    // Establishment-level EPF switch as in force for THIS payroll month — with EPF off no
    // PF is deducted, and services/salary.js's employer PF (derived from the presence of
    // this deduction) follows. The employee's own PF row is left untouched.
    if (!isEpfApplicableForPeriod(complianceSettings, month, year)) {
      deductionComponents = deductionComponents.filter(c => !isProvidentFundDeduction(c.deductionName));
    }

    // eslint-disable-next-line global-require
    const { ESI_WAGE_CEILING, ESI_WAGE_CEILING_DIFFERENTLY_ABLED, getContributionPeriodBounds } = require('./ctcCalculator');
    const { start: esiPeriodStart, end: esiPeriodEnd } = getContributionPeriodBounds(new Date());
    const coverageSinceBeforeResolve = employee?.otherConfigurations?.esiCoverageSince
      ? new Date(employee.otherConfigurations.esiCoverageSince)
      : null;
    // Mirrors getEmployeeCtcBreakdown's identical construction (ctcCalculator.js) exactly,
    // so both engines solve the same Gross/Balancing/ESI figures for the same employee.
    const esiContext = {
      continuing:
        !!coverageSinceBeforeResolve && coverageSinceBeforeResolve >= esiPeriodStart && coverageSinceBeforeResolve <= esiPeriodEnd,
      ceiling: employee?.isDiffrentlyAbled ? ESI_WAGE_CEILING_DIFFERENTLY_ABLED : ESI_WAGE_CEILING,
      disabled: employee?.otherConfigurations?.enableESI === false,
    };
    // if (!salaryData) {
    //   throw new Error("Salary information not found");
    // }

    let calculatedSalaryComponents;
    let basicSalary;

    // Whether `structureVersion` (the most recent revision at/before this month) is ALSO
    // the employee's overall latest revision — i.e. nothing has superseded it. When it is,
    // this month is governed by "now", not by a historical gap between two revisions, so
    // resolving live (same engine the CTC Structure tab uses) is both safe and necessary:
    // it's what makes a standalone component added to the CTC tab AFTER the last revision
    // (e.g. a new "Other Allowance") actually take effect, instead of staying invisible to
    // payroll forever until another revision is run. When a LATER revision exists, this
    // month sits in a historical gap that the later revision doesn't apply to — freeze to
    // the old snapshot exactly as before, so reprocessing an unpaid backlog month never
    // silently absorbs a future revision's structure.
    const isSupersededByLaterRevision = structureVersion && await SalaryStructureVersion.exists({
      employee: employeeId,
      effectiveFrom: { $gt: structureVersion.effectiveFrom }
    });

    if (structureVersion && isSupersededByLaterRevision) {
      calculatedSalaryComponents = structureVersion.earnings;
      basicSalary = Number(
        structureVersion.earnings.find(e => e.componentName === "Basic Salary")?.calculatedAmount || 0
      );
    } else if (structureVersion && structureVersion.annualCTC > 0) {
      // A committed CTC exists and nothing later supersedes it — re-solve the CURRENT
      // split against that committed annualCTC (same engine — solveEarningsForCtc — the
      // Salary Structure (CTC) tab itself anchors on), instead of plain resolveEarnings
      // below. resolveEarnings only reads whatever rupee amount is ALREADY persisted on
      // the Balancing component; an employee who's only ever gone through the initial CTC
      // setup (never an actual Revise Salary) has that amount recorded solely inside this
      // structureVersion snapshot, never frozen onto an employee-specific SalaryComponent
      // override — so resolveEarnings saw a Balancing constant of 0, collapsing Gross (and
      // every percentage-based earning/deduction derived from it) entirely to 0.
      // eslint-disable-next-line global-require
      const { solveEarningsForCtc } = require('./reviseSalary');
      const globalComponentsById = new Map(globalEarningTemplates.map(t => [t._id.toString(), t]));
      const pfPolicy = resolveEpfPolicyFromComplianceSettings(complianceSettings);
      // The agreed CTC is re-split under THIS month's EPF setting — with EPF off, employer PF
      // is spread across the earnings instead of netted out (same as the Salary Structure
      // tab). Paid months are never reprocessed, so issued salaries don't change.
      const solved = solveEarningsForCtc(
        salaryComponents,
        structureVersion.annualCTC / 12,
        pfPolicy,
        globalComponentsById,
        esiContext,
        month,
        year,
        // Employee's own EPF toggle too — deductionComponents already excludes PF when
        // the establishment switch is off (filtered above), so this covers both.
        isEpfApplicableForPeriod(complianceSettings, month, year) &&
          deductionComponents.some(d => isProvidentFundDeduction(d.deductionName))
      );
      if (!solved.warning && solved.basicComponent) {
        calculatedSalaryComponents = solved.earnings;
        basicSalary = solved.basicSalary;
      } else {
        const resolved = resolveEarnings(salaryComponents, globalComponentsById, { monthlyCtc: structureVersion.annualCTC / 12 });
        calculatedSalaryComponents = resolved.earnings;
        basicSalary = resolved.basicSalary;
      }
    } else {
      // Falls through here when no committed CTC exists at all (never even an initial hire
      // version — the common case for a brand-new employee who's only ever had their
      // components configured, never opened their CTC tab and never been through Revise
      // Salary), or when the stored one is corrupted (annualCTC <= 0 — e.g. a stale
      // self-heal backfill created before mergeGlobalAndEmployeeComponents' own fix, which
      // silently dropped an active override tied to a since-deactivated global template and
      // reconstructed a bogus ₹0 CTC from what was left).
      //
      // Plain resolveEarnings can't be trusted as the first move here: it only reads
      // whatever rupee amount is ALREADY persisted on each component, and a never-revised
      // employee's Balancing component (e.g. "Special Allowance") has never had one —
      // collapsing Gross (and every percentage-based earning/deduction derived from it,
      // Basic and HRA included) entirely to 0. This is the exact same failure as
      // babar/insha's bug, just hit by an employee who never even got the chance to
      // accumulate a corrupted version.
      //
      // getEmployeeCtcBreakdown (the Salary Structure/CTC tab's own use-case) already knows
      // how to derive a trustworthy anchor CTC for exactly this employee — reconstructing
      // one from whatever IS resolvable and self-healing a real SalaryStructureVersion as a
      // side effect, so every later month (and the CTC tab itself) reads the same committed
      // figure directly from then on instead of repeating this reconstruction. Reusing it
      // here — rather than duplicating that reconstruction logic — guarantees payroll
      // processing and the CTC tab can never disagree on a pre-revision employee's CTC.
      // Lazy require: ctcCalculator.js itself requires this file at load time, so a
      // top-level require here would be circular.
      // eslint-disable-next-line global-require
      const { getEmployeeCtcBreakdown } = require('./ctcCalculator');
      const breakdown = await getEmployeeCtcBreakdown({ corporateUserID, employeeId, month, year });
      const globalComponentsById = new Map(globalEarningTemplates.map(t => [t._id.toString(), t]));

      if (breakdown.annualCtc > 0) {
        // breakdown.earnings/basicSalary are ALREADY solved against this same anchor CTC by
        // getEmployeeCtcBreakdown itself, with its own correct esiContext applied — re-solving
        // a second time here (as this used to do, via a second solveEarningsForCtc call with
        // no esiContext) only risked disagreeing with the CTC tab's own figures for an
        // ESI-eligible employee. Use it directly instead of duplicating the solve.
        calculatedSalaryComponents = breakdown.earnings;
        basicSalary = breakdown.basicSalary;
      } else {
        // Genuinely nothing to anchor on anywhere (e.g. no Basic Salary component configured
        // for this employee at all) — last-resort fallback, unchanged from before.
        const resolved = resolveEarnings(salaryComponents, globalComponentsById);
        calculatedSalaryComponents = resolved.earnings;
        basicSalary = resolved.basicSalary;
      }
    }

    // Compute pre-deduction gross salary to use as base for GROSS_SALARY type deductions
    // (ESI wages, PT-on-gross, etc.) — components marked isPartOfGross: false (CTC
    // benefits that sit outside Gross) are excluded, same as everywhere else gross is
    // summed. undefined (pre-existing components) counts as part of gross.
    const grossSalary = calculatedSalaryComponents.reduce(
      (sum, c) => sum + (c.isPartOfGross === false ? 0 : (c.calculatedAmount || 0)), 0
    );

    let calculatedDeductionComponents = calculateComponentAmounts(deductionComponents, basicSalary, grossSalary, month, year);

    // ---------------- LOSS OF PAY ----------------
    // LOP is unpaid days, not a deduction (Code on Wages s.20(2), EPF Scheme para 29(3)):
    // every earning scales by the paid share of the month, paise kept, and deductions are
    // recomputed on what is actually paid — PF on the paid Basic (still capped at the FULL
    // monthly ceiling, rounded to the rupee as EPFO does), GROSS_SALARY-based deductions on
    // the paid gross. Professional Tax stays at the standing slab and FIXED company
    // deductions (canteen, insurance) are untouched. The full-month figures are returned
    // alongside so the caller can re-estimate TDS (only this month is reduced) and keep the
    // per-day rate for joiner/leaver days on the unreduced gross.
    // ---------------- PART MONTH (joiner / leaver) ----------------
    // params.partMonth ({ eligibleDays, daysInMonth }) prorates the same way, together with
    // LOP — see applyPaidDays. `proration` carries the full-month figures whenever either applies.
    let lossOfPayResult = null;
    let prorationResult = null;
    if (params.lossOfPay || params.partMonth) {
      const applied = applyPaidDays({
        salaryComponents: calculatedSalaryComponents,
        deductionComponents,
        fullDeductionComponents: calculatedDeductionComponents,
        basicSalary,
        grossSalary,
        partMonth: params.partMonth,
        lossOfPay: params.lossOfPay,
        month,
        year,
      });
      if (applied) {
        calculatedSalaryComponents = applied.salaryComponents;
        calculatedDeductionComponents = applied.deductionComponents;
        prorationResult = {
          paidShare: applied.paidShare,
          eligibleShare: applied.eligibleShare,
          partMonth: applied.partMonth,
          fullGross: applied.fullGross,
          fullBasic: applied.fullBasic,
          fullSalaryComponents: transformComponents(applied.fullSalaryComponents, "componentName"),
          fullDeductionComponents: transformComponents(applied.fullDeductionComponents, "deductionName"),
        };
        lossOfPayResult = applied.lossOfPay;
      }
    }

    // ---------------- LEAVE DATA ----------------
    const leaveCount = salaryData?.leaveCount || 0;
    const leaveDeduction = salaryData?.leaveDeduction || 0;
    const attendancePercentage = salaryData?.attendancePercentage || 0;
    return {
      salaryComponents: transformComponents(calculatedSalaryComponents, "componentName"),
      deductionComponents: transformComponents(calculatedDeductionComponents, "deductionName"),
      lossOfPay: lossOfPayResult,
      proration: prorationResult,
      leaveDetails: {
        leaveCount,
        leaveDeduction,
        attendancePercentage
      }
    };

  } catch (error) {
    console.log("Error fetching components:", error);
    return {
      error: true,
      message: "Failed to load employee components",
      details: error
    };
  }
});

exports.getEmployeeDeductionComponentListByEmail = asyncHandler(async (params) => {
  try {
    const {
      corporateUserID,
      employeeEmail,
      basicSalary 
    } = params;

    const queryConditions = {
      corporateUser: corporateUserID,
      employeeEmail: employeeEmail,
      isGlobal: false
    };

    const globalComponentData = await DeductionComponent.find({
      corporateUser: corporateUserID,
      employee: null,
      isGlobal: true,
      status: "ACTIVE"
    });

    const employeeComponentData = await DeductionComponent.find(queryConditions);

    const overriddenGlobalIds = new Set(
      employeeComponentData
        .filter(item => item.globalComponentId)
        .map(item => item.globalComponentId.toString())
    );
    // Self-healing fallback for an override created before it was ever linked to its
    // global template (globalComponentId still null) — see
    // getEmployeeDeductionComponentsList for the full rationale.
    const overriddenGlobalNames = new Set(
      employeeComponentData
        .filter(item => !item.globalComponentId && item.deductionName)
        .map(item => item.deductionName.trim().toLowerCase())
    );

    const filteredGlobalComponents = globalComponentData.filter(
      item =>
        !overriddenGlobalIds.has(item._id.toString()) &&
        !overriddenGlobalNames.has((item.deductionName || '').trim().toLowerCase())
    );

    const combinedComponentData = [
      ...filteredGlobalComponents,
      ...employeeComponentData
    ];

    const calculateComponentAmount = (component) => {
      const isYearly = component.calculationBasis === "YEARLY";

      /* FIXED */
      if (component.calculationType === "FIXED") {
        // Self-heal a PF deduction auto-frozen to FIXED the first time it hit the
        // statutory cap (see deductionComponent.js's one-time freeze) — otherwise it
        // stays pinned at whatever rupee figure was correct when frozen, even after the
        // ceiling later changes. globalComponentId is only ever set on that kind of
        // auto-frozen override, never on a genuinely bespoke FIXED PF amount.
        if (isProvidentFundDeduction(component.deductionName) && component.globalComponentId) {
          return Math.min((Number(basicSalary || 0) * 12) / 100, resolvePfMonthlyCap());
        }
        const amount = Number(component.amountPercentage || 0);
        return isYearly ? amount / 12 : amount;
      }

      /* PERCENTAGE → BASIC SALARY */
      if (component.calculationType === "PERCENTAGE") {
        const raw = (Number(basicSalary || 0) * Number(component.amountPercentage || 0)) / 100;
        let amount = isYearly ? raw / 12 : raw;
        if (isProvidentFundDeduction(component.deductionName)) amount = Math.min(amount, resolvePfMonthlyCap());
        return amount;
      }

      return 0;
    };

    const calculatedComponents = combinedComponentData.map(component => ({
      ...component.toObject(),
      calculatedAmount: calculateComponentAmount(component)
    }));

    const totalDeduction = calculatedComponents.reduce(
      (sum, item) => sum + Number(item.calculatedAmount || 0),
      0
    );

    return {
      componentData: calculatedComponents,
      totalDeduction
    };

  } catch (error) {
    console.error("Deduction calculation error:", error);
    throw error;
  }
});


// function calculateComponentAmounts(components, basicSalary) {
  
//   return components.map(c => {
//     let calculatedAmount = 0;

//     if (c.calculationType === "FIXED") {
//       calculatedAmount = Number(c.amountPercentage);
//     }

//     if (c.calculationType === "PERCENTAGE") {
//       calculatedAmount = (Number(c.amountPercentage) / 100) * basicSalary;
//     }

//     return {
//       ...c.toObject?.() || c,
//       calculatedAmount
//     };
//   });
// }

function transformComponents(components, nameKey) {
  return components.map(c => ({
    [nameKey]: c[nameKey],
    calculatedAmount: c.calculatedAmount,
    // Lets the payroll run find the Balancing component by role (not by name) when it
    // lays out the display-only PF Earnings line (services/pfEarningsLine.js).
    calculationType: c.calculationType,
    // Only meaningful for earnings (undefined/ignored for deductions) — undefined is
    // treated as "part of gross" everywhere this is read, so pre-existing components are
    // unaffected.
    isPartOfGross: c.isPartOfGross,
  }));
}



// function calculateComponentAmounts(components, basicSalary) {
//   return components.map(c => {
//     let calculatedAmount = 0;

//     if (c.calculationType === "FIXED") {
//       calculatedAmount = Number(c.amountPercentage);
//     }

//     if (c.calculationType === "PERCENTAGE") {
//       calculatedAmount = (Number(c.amountPercentage) / 100) * basicSalary;
//     }

//     return {
//       ...c.toObject?.() || c,
//       calculatedAmount
//     };
//   });
// }

function calculateComponentAmounts(components, basicSalary, grossSalaryAmount = 0, month, year) {
  const componentMap = new Map();

  // Step 1: Prepare map (same structure as input)
  components.forEach(c => {
    componentMap.set(c._id.toString(), {
      ...c.toObject?.() || c,
      calculatedAmount: null
    });
  });

  // Step 2: Recursive calculation
  function calculate(comp, baseOverride = null) {
    if (comp.calculatedAmount !== null) return comp.calculatedAmount;

    let amount = 0;

    const isYearly = comp.calculationBasis === "YEARLY";
    const base = baseOverride !== null ? baseOverride : basicSalary;

    if (comp.calculationType === "FIXED" || comp.calculationType === "BALANCING") {
      // BALANCING components (e.g. Special Allowance) don't reformulate here — their
      // rupee value is precomputed and persisted (by redistributeBasicSalary/reviseSalary)
      // directly into amountPercentage, same storage convention as FIXED. Re-deriving
      // Gross from within this function would reintroduce the circularity this engine
      // avoids elsewhere.
      const raw = Number(comp.amountPercentage);
      amount = isYearly ? raw / 12 : raw;

      // A PF deduction auto-frozen to FIXED the first time 12% of Basic exceeded the
      // statutory cap (see deductionComponent.js's one-time freeze) stays pinned at
      // whatever rupee figure was correct back THEN forever after — self-heal it against
      // THIS payroll run's own ceiling instead of silently understating PF for every
      // month processed after a ceiling change. globalComponentId (only ever set on an
      // auto-frozen override, never on a component with no backing global template)
      // distinguishes this from a genuinely bespoke, admin-set FIXED PF amount, which is
      // left untouched.
      if (comp.calculationType === "FIXED" && isProvidentFundDeduction(comp.deductionName) && comp.globalComponentId) {
        amount = capPfAmount(basicSalary * 0.12, month, year);
      }
    }

    else if (comp.calculationType === "PERCENTAGE") {

      // % of Basic or gross (default behavior when no parent component)
      if (!comp.calculationBasedOn) {
        const raw = (Number(comp.amountPercentage) / 100) * base;
        amount = isYearly ? raw / 12 : raw;
      }

      // % of another component
      else {
        const parent = componentMap.get(comp.calculationBasedOn.toString());

        if (!parent) {
          amount = 0;
        } else {
          const parentAmount = calculate(parent);
          const raw = (Number(comp.amountPercentage) / 100) * parentAmount;
          amount = isYearly ? raw / 12 : raw;
        }
      }

      // Uses the PAYROLL MONTH's ceiling (month/year passed in from
      // getEmployeeSalaryComponentForProcessSalary) — a historical month keeps its
      // historical cap even when this function runs long after the ceiling changed.
      if (isProvidentFundDeduction(comp.deductionName)) amount = capPfAmount(amount, month, year);
    }

    comp.calculatedAmount = amount;
    return amount;
  }

  // Step 3: If grossSalaryAmount provided, do two-pass for GROSS_SALARY deduction type
  if (grossSalaryAmount > 0) {
    // Pass 1: calculate all non-GROSS_SALARY deductions first
    let nonGrossSalaryTotal = 0;
    for (const c of components) {
      const comp = componentMap.get(c._id.toString());
      if (comp.salaryDeductionType !== 'GROSS_SALARY') {
        nonGrossSalaryTotal += calculate(comp);
      }
    }

    // Adjusted gross base = totalEarnings - non-GROSS_SALARY deductions
    const grossSalaryBase = grossSalaryAmount - nonGrossSalaryTotal;

    // Pass 2: calculate GROSS_SALARY type deductions using adjusted gross base
    for (const c of components) {
      const comp = componentMap.get(c._id.toString());
      if (comp.salaryDeductionType === 'GROSS_SALARY' && comp.calculatedAmount === null) {
        calculate(comp, grossSalaryBase);
      }
    }
  } else {
    // No gross salary context — calculate all components normally
    components.forEach(c => {
      const comp = componentMap.get(c._id.toString());
      calculate(comp);
    });
  }

  // Step 4: Return SAME structure as before
  return components.map(c => {
    const comp = componentMap.get(c._id.toString());
    return {
      ...c.toObject?.() || c,
      calculatedAmount: comp.calculatedAmount
    };
  });
}

/**
 * Loss of Pay is unpaid days, not a deduction (Code on Wages s.20(2), EPF Scheme para
 * 29(3)): every earning scales by the paid share of the month, paise kept, and deductions
 * are recomputed on what is actually paid — PF on the paid Basic (still capped at the FULL
 * monthly ceiling, rounded to the rupee as EPFO does), GROSS_SALARY-based deductions on the
 * paid gross. Professional Tax stays at the standing slab and FIXED company deductions
 * (canteen, insurance) are untouched.
 *
 * The paid share is (days in month − LOP days) / days in month, or — when HR typed over
 * the amount — (gross − amount) / gross. Returns null when there is nothing to apply.
 * The full-month figures come back alongside so the caller can re-estimate TDS (only this
 * month is reduced) and keep charging joiner/leaver days at the unreduced per-day rate.
 */
/**
 * Pays only the days the employee is paid for in the month — a joiner/leaver part month
 * (partMonth: { eligibleDays, daysInMonth }) and/or Loss of Pay. Every earning is scaled to
 * the paise by (eligible share − LOP share), never rounded per component, and deductions are
 * recomputed on what is actually paid (see applyLossOfPay above for the LOP rules). In a
 * part month, FIXED company deductions are also prorated by eligible days ÷ days in month
 * (LOP never touches them). Professional Tax stays at the configured monthly amount, and
 * the PF wage ceiling stays the full monthly one. LOP days are charged at the full month's
 * per-day rate. Returns null when the whole month is paid.
 */
function applyPaidDays({ salaryComponents, deductionComponents, fullDeductionComponents, basicSalary, grossSalary, partMonth, lossOfPay, month, year }) {
  const partDaysInMonth = Number(partMonth?.daysInMonth) || 0;
  const eligibleDays = Math.max(Number(partMonth?.eligibleDays) || 0, 0);
  const isPartMonth = partDaysInMonth > 0 && eligibleDays < partDaysInMonth;
  const hasLossOfPay = !!lossOfPay && Number(lossOfPay.days) > 0;
  if ((!isPartMonth && !hasLossOfPay) || !(grossSalary > 0)) return null;

  const eligibleShare = isPartMonth ? eligibleDays / partDaysInMonth : 1;
  const eligibleGross = roundToPaise(grossSalary * eligibleShare);

  let lossOfPayResult = null;
  let lopAmount = 0;
  if (hasLossOfPay) {
    const daysInMonth = Number(lossOfPay.daysInMonth) || 0;
    const requestedAmount = lossOfPay.isAmountOverridden
      ? Number(lossOfPay.amount) || 0
      : (daysInMonth > 0 ? (grossSalary * Number(lossOfPay.days)) / daysInMonth : 0);
    lopAmount = Math.min(Math.max(roundToPaise(requestedAmount), 0), eligibleGross);
    lossOfPayResult = {
      days: Number(lossOfPay.days),
      daysInMonth,
      amount: lopAmount,
      isAmountOverridden: !!lossOfPay.isAmountOverridden,
    };
  }
  const paidShare = Math.max(eligibleShare - lopAmount / grossSalary, 0);

  const paidSalaryComponents = salaryComponents.map(c => ({
    ...(c.toObject?.() || c),
    calculatedAmount: roundToPaise((c.calculatedAmount || 0) * paidShare),
  }));
  const paidBasic = roundToPaise(basicSalary * paidShare);
  const paidGross = paidSalaryComponents.reduce(
    (sum, c) => sum + (c.isPartOfGross === false ? 0 : (c.calculatedAmount || 0)), 0
  );

  const fullByName = new Map(fullDeductionComponents.map(d => [d.deductionName, d.calculatedAmount]));
  const paidDeductionComponents = calculateComponentAmounts(deductionComponents, paidBasic, paidGross, month, year)
    .map(d => {
      if (d.deductionName === 'Professional Tax') {
        return { ...d, calculatedAmount: fullByName.get(d.deductionName) || 0 };
      }
      if (isProvidentFundDeduction(d.deductionName)) {
        return { ...d, calculatedAmount: Math.round(d.calculatedAmount || 0) };
      }
      // A fixed rupee amount — the auto-frozen PF is excluded above (recomputed on Basic).
      const isFixedAmount = d.calculationType === 'FIXED' || d.calculationType === 'BALANCING';
      if (isPartMonth && isFixedAmount) {
        return { ...d, calculatedAmount: roundToPaise((fullByName.get(d.deductionName) || 0) * eligibleShare) };
      }
      return d;
    });

  return {
    salaryComponents: paidSalaryComponents,
    deductionComponents: paidDeductionComponents,
    paidShare,
    eligibleShare,
    fullGross: grossSalary,
    fullBasic: basicSalary,
    fullSalaryComponents: salaryComponents,
    fullDeductionComponents,
    partMonth: isPartMonth ? { eligibleDays, daysInMonth: partDaysInMonth } : null,
    lossOfPay: lossOfPayResult,
  };
}
exports.applyPaidDays = applyPaidDays;

function applyLossOfPay({ salaryComponents, deductionComponents, fullDeductionComponents, basicSalary, grossSalary, lossOfPay, month, year }) {
  if (!lossOfPay || !(Number(lossOfPay.days) > 0)) return null;
  const applied = applyPaidDays({ salaryComponents, deductionComponents, fullDeductionComponents, basicSalary, grossSalary, lossOfPay, month, year });
  if (!applied) return null;
  return {
    salaryComponents: applied.salaryComponents,
    deductionComponents: applied.deductionComponents,
    lossOfPay: {
      ...applied.lossOfPay,
      paidShare: applied.paidShare,
      fullGross: applied.fullGross,
      fullBasic: applied.fullBasic,
      fullSalaryComponents: applied.fullSalaryComponents,
      fullDeductionComponents: applied.fullDeductionComponents,
    },
  };
}
exports.applyLossOfPay = applyLossOfPay;

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
    // Sum precisely using toFixed + parseFloat to avoid float precision errors
    const totalExtraEarnings = parseFloat(
      (parseFloat(incentiveAmount) + parseFloat(bonusAmount) + parseFloat(overtimeAmount)).toFixed(2)
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

// Persists a resolved amount as an employee-specific override — find-or-create pattern
// (same one editSalaryComponent uses). Freezes calculationType to FIXED by default (a
// %-of-Basic component like HRA becomes "frozen at hire" on every later read, per this
// module's convention) — pass `calculationType: 'BALANCING'` explicitly for the Balancing
// component instead of "preserve whatever's already there": its own stored type must stay
// 'BALANCING' so redistributeBasicSalary/redistributeEarningComponent can keep
// re-identifying "which component is the remainder absorber" on the NEXT edit
// (isBalancingComponent, used below), but it can't be trusted to already say that — it may
// be stuck as something else (e.g. an earlier bug briefly forced every override to FIXED,
// including this one). Explicitly setting BALANCING here every time self-heals that
// automatically. mergeComponents.js's resolveEarnings already reads a persisted BALANCING
// override's amountPercentage exactly like FIXED, so this costs nothing on the display side.
// `calculationBasis`, when passed, overrides the stored basis too — needed when a component
// switches between "Percentage of Basic" and "Fixed amount" (redistributeEarningComponent),
// since a FIXED value carries no meaningful basis and a %-of-Basic one must have
// BASIC_SALARY specifically, regardless of whatever basis it happened to have before.
const persistComponentAmount = async (
  corporateUserID,
  employeeId,
  component,
  amount,
  { calculationType = 'FIXED', calculationBasis, overridesGlobalRule = false } = {}
) => {
  if (component.employee) {
    component.amountPercentage = amount;
    component.calculationType = calculationType;
    if (calculationBasis !== undefined) component.calculationBasis = calculationBasis;
    // Only ever SET this — never reset to false here — so a component's own prior
    // deliberate-override marking (from an earlier Edit Basic Salary/Edit Component) isn't
    // silently cleared by an unrelated persist that doesn't pass this flag (e.g. the
    // "other affected earnings" refresh loop below, which should keep following org policy).
    if (overridesGlobalRule) component.overridesGlobalRule = true;
    await component.save();
    return component;
  }
  return SalaryComponent.create({
    corporateUser: corporateUserID,
    employee: employeeId,
    componentName: component.componentName,
    calculationType,
    amountPercentage: amount,
    calculationBasis: calculationBasis !== undefined ? calculationBasis : component.calculationBasis,
    calculationBasedOn: component.calculationBasedOn,
    status: 'ACTIVE',
    isGlobal: false,
    globalComponentId: component._id,
    overridesGlobalRule,
  });
};
exports.persistComponentAmount = persistComponentAmount;

// The employee's currently-committed monthly CTC — same "latest version effective on/before
// now" lookup (with createdAt tiebreaker) getEmployeeCtcBreakdown anchors on. Needed so a
// "% of CTC" Basic resolves to its real amount when these edit flows read the current
// structure; undefined when there's no valid committed CTC (resolveEarnings then falls
// back on its own).
const findCommittedMonthlyCtc = async (employeeId) => {
  const version = await SalaryStructureVersion.findOne({ employee: employeeId, effectiveFrom: { $lte: new Date() } })
    .sort({ effectiveFrom: -1, createdAt: -1 })
    .lean();
  return version && version.annualCTC > 0 ? version.annualCTC / 12 : undefined;
};

exports.redistributeBasicSalary = async ({
  corporateUserID,
  employeeId,
  calculationType = 'FIXED',
  amountPercentage,
  // 'GROSS_SALARY' | 'CTC' — which base a PERCENTAGE Basic resolves against. Ignored for FIXED.
  calculationBasis = 'GROSS_SALARY',
}) => {
  const [salaryComponents, globalEarningTemplates] = await Promise.all([
    mergeGlobalAndEmployeeComponents(SalaryComponent, { corporateUserID, employeeId }),
    // Same source of truth reviseSalary.js re-solves from — see effectiveRule's comment:
    // a real hired employee has HRA (and similar) frozen as a FIXED snapshot at hire, so
    // recomputing against each component's OWN definition would leave HRA unchanged when
    // Basic moves. Re-deriving from the org's live rule instead keeps this quick edit
    // consistent with what Revise Salary would produce for the same new Basic.
    SalaryComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }).lean(),
  ]);
  const globalComponentsById = new Map(globalEarningTemplates.map((t) => [t._id.toString(), t]));

  const basicComponent = salaryComponents.find((c) => c.componentName === 'Basic Salary');
  const balancingComponent = salaryComponents.find((c) => isBalancingComponent(c, globalComponentsById));

  if (!basicComponent) {
    throw new Error('No "Basic Salary" component is configured for this employee.');
  }
  if (!balancingComponent) {
    throw new Error('No Balancing component (e.g. Special Allowance) is configured for this employee.');
  }
  if (calculationType !== 'FIXED' && calculationType !== 'PERCENTAGE') {
    throw new Error('Calculation type must be either a fixed amount or a percentage of Gross/CTC.');
  }
  if (calculationType === 'PERCENTAGE' && calculationBasis !== 'GROSS_SALARY' && calculationBasis !== 'CTC') {
    throw new Error('Calculation basis must be either % of Gross or % of CTC.');
  }
  if (calculationType === 'PERCENTAGE' && !((amountPercentage || 0) >= 0 && amountPercentage <= 100)) {
    throw new Error('Percentage must be between 0 and 100.');
  }
  if (calculationType === 'FIXED' && !((amountPercentage || 0) >= 0)) {
    throw new Error('Amount cannot be negative.');
  }

  // Current Gross — computed against the structure exactly as it stands today — is the
  // fixed target this edit must preserve.
  const monthlyCtc = await findCommittedMonthlyCtc(employeeId);
  const { grossSalary: currentGross } = resolveEarnings(salaryComponents, undefined, { monthlyCtc });

  // Percentage mode is "% of Gross" or "% of CTC" — never "% of Basic", which would be
  // circular for Basic itself. "% of CTC" needs the employee's committed CTC to resolve
  // against; without one there's no honest figure to preview or persist.
  const isPercentOfCtc = calculationType === 'PERCENTAGE' && calculationBasis === 'CTC';
  if (isPercentOfCtc && !(monthlyCtc > 0)) {
    throw new Error('This employee has no committed CTC yet — set one with Revise Salary before using % of CTC.');
  }
  let newBasicAmount = amountPercentage;
  if (calculationType === 'PERCENTAGE') {
    newBasicAmount = ((amountPercentage || 0) / 100) * (isPercentOfCtc ? monthlyCtc : currentGross);
  }

  // Below-50%-of-Gross is a compliance concern, not something to block on — surfaced as a
  // warning (see ctcCalculator.js's identical check) so the user can proceed deliberately
  // instead of being unable to save at all. Checked against the just-ENTERED rule first
  // (see isBasicSalaryCompliant's doc comment) — "50% of Gross" can never be non-compliant,
  // whatever newBasicAmount rounds to against currentGross. "% of CTC" qualifies the same
  // way, since Gross never exceeds CTC (see basicPercentRuleForCompliance).
  const basicPercentOfGrossRule = calculationType === 'PERCENTAGE' ? amountPercentage || 0 : null;
  const basicBelowFloorWarning = !isBasicSalaryCompliant(newBasicAmount, currentGross, basicPercentOfGrossRule)
    ? 'The Basic Salary is below 50% of Gross. You may not be compliant as per the labor codes. Please double check before proceeding.'
    : undefined;

  // Recompute every earning except Basic/Balancing against the new Basic, using each
  // component's EFFECTIVE rule (globalRule when it overrides an org template, its own
  // definition otherwise) — mirrors reviseSalary.js's resolveAllAmounts exactly, so both
  // editing surfaces agree on what "50% of Basic" etc. resolves to.
  const amountCache = new Map([[basicComponent._id.toString(), newBasicAmount]]);
  const resolveEarningAmount = (component) => {
    if (!component) return 0;
    const key = component._id.toString();
    if (amountCache.has(key)) return amountCache.get(key);

    const rule = effectiveRule(component, globalComponentsById);
    let amount = 0;
    if (rule.calculationType === 'FIXED') {
      amount = rule.amountPercentage || 0;
    } else if (rule.calculationType === 'PERCENTAGE') {
      if (rule.calculationBasis === 'CTC') {
        // Same fallback as resolveEarnings when there's no committed CTC: % of Gross.
        amount = ((rule.amountPercentage || 0) / 100) * (monthlyCtc > 0 ? monthlyCtc : currentGross);
      } else if (rule.calculationBasis === 'GROSS_SALARY') {
        amount = ((rule.amountPercentage || 0) / 100) * currentGross;
      } else if (rule.calculationBasis === 'BASIC_SALARY') {
        amount = ((rule.amountPercentage || 0) / 100) * newBasicAmount;
      } else {
        const base = rule.calculationBasedOnName
          ? salaryComponents.find((o) => o.componentName === rule.calculationBasedOnName)
          : salaryComponents.find(
              (o) => rule.calculationBasedOn && o._id.toString() === rule.calculationBasedOn.toString()
            );
        amount = ((rule.amountPercentage || 0) / 100) * resolveEarningAmount(base);
      }
    }
    amountCache.set(key, amount);
    return amount;
  };

  const nonBalancingComponents = salaryComponents.filter(
    (c) => !isBalancingComponent(c, globalComponentsById) && c !== basicComponent
  );
  const resolvedOthers = nonBalancingComponents.map((c) => ({ component: c, amount: resolveEarningAmount(c) }));
  const availableForBasic = currentGross - resolvedOthers.reduce((sum, r) => sum + r.amount, 0);

  const newSpecialAllowance = availableForBasic - newBasicAmount;
  if (newSpecialAllowance < 0) {
    throw new Error(
      `This doesn't fit: after Basic, HRA and the other components, only ₹${Math.round(availableForBasic)} / month of this CTC is left. Enter a smaller amount.`
    );
  }

  // Same distinction as redistributeEarningComponent: a PERCENTAGE-type Basic stores the
  // PERCENT itself (e.g. 50) in amountPercentage, not the rupee amount it resolves to.
  const basicPersistValue = calculationType === 'PERCENTAGE' ? amountPercentage : newBasicAmount;
  await persistComponentAmount(corporateUserID, employeeId, basicComponent, basicPersistValue, {
    calculationType,
    calculationBasis: calculationType === 'PERCENTAGE' ? calculationBasis : basicComponent.calculationBasis,
    // This IS the deliberate edit — mark it so the next read/re-solve (e.g. the CTC tab's
    // unpaid-month self-heal, which otherwise re-derives Basic from the org's global
    // template every time) uses this employee's own new value instead of discarding it.
    overridesGlobalRule: true,
  });
  await persistComponentAmount(corporateUserID, employeeId, balancingComponent, newSpecialAllowance, {
    calculationType: 'BALANCING',
  });

  // Any OTHER earning that carries a globalRule (e.g. HRA "50% of Basic") needs its own
  // frozen override updated too — otherwise it stays stuck at its old amount the next
  // time the CTC tab reads it, even though it was correctly re-derived just above.
  for (const { component, amount } of resolvedOthers) {
    const template = findGlobalTemplate(component, globalComponentsById);
    if (!template || template.calculationType === 'BALANCING') continue;
    await persistComponentAmount(corporateUserID, employeeId, component, amount);
  }

  return {
    basicSalary: newBasicAmount,
    specialAllowance: newSpecialAllowance,
    grossSalary: currentGross,
    warning: basicBelowFloorWarning,
  };
};

// Redistributes a SINGLE non-Basic, non-Balancing earning (e.g. HRA, Medical Allowance) to
// a new amount — either a live percentage of Basic or a frozen rupee amount — keeping
// Gross fixed exactly like redistributeBasicSalary above. Special Allowance absorbs the
// difference. Unlike a Basic edit, every OTHER earning is left completely untouched: only
// the target component's own basis changed, so nothing else needs re-deriving.
//
// Choosing PERCENTAGE here persists the component as a genuinely LIVE percentage-of-Basic
// (calculationBasis: 'BASIC_SALARY'), not a frozen snapshot — deliberately different from
// this file's usual "freeze everything as FIXED" convention, because the whole point of
// offering this choice is "make this component follow Basic automatically from now on"
// (see the frontend copy). A component saved this way needs no globalRule at all to stay
// in sync on every future Basic change — resolveEarnings/effectiveRule already read a
// PERCENTAGE/BASIC_SALARY component's own definition directly.
exports.redistributeEarningComponent = async ({
  corporateUserID,
  employeeId,
  componentId,
  calculationType,
  amountPercentage,
  // 'GROSS_SALARY' | 'BASIC_SALARY' — which base a PERCENTAGE edit resolves against
  // (e.g. Conveyance Allowance configured as "10% of Gross" needs to stay resolvable
  // against Gross on edit, not silently forced onto Basic). Ignored for FIXED.
  calculationBasis = 'BASIC_SALARY',
}) => {
  const [salaryComponents, globalEarningTemplates] = await Promise.all([
    mergeGlobalAndEmployeeComponents(SalaryComponent, { corporateUserID, employeeId }),
    SalaryComponent.find({ corporateUser: corporateUserID, employee: null, isGlobal: true, status: 'ACTIVE' }).lean(),
  ]);
  const globalComponentsById = new Map(globalEarningTemplates.map((t) => [t._id.toString(), t]));

  const basicComponent = salaryComponents.find((c) => c.componentName === 'Basic Salary');
  const balancingComponent = salaryComponents.find((c) => isBalancingComponent(c, globalComponentsById));
  const targetComponent = salaryComponents.find((c) => c._id.toString() === componentId);

  if (!targetComponent) {
    throw new Error('This component is no longer configured for this employee.');
  }
  if (basicComponent && targetComponent._id.toString() === basicComponent._id.toString()) {
    throw new Error('Use Edit Basic Salary to change Basic Salary.');
  }
  if (isBalancingComponent(targetComponent, globalComponentsById)) {
    throw new Error('Special Allowance is computed automatically and cannot be edited directly.');
  }
  if (!basicComponent) {
    throw new Error('No "Basic Salary" component is configured for this employee.');
  }
  if (!balancingComponent) {
    throw new Error('No Balancing component (e.g. Special Allowance) is configured for this employee.');
  }
  if (calculationType !== 'FIXED' && calculationType !== 'PERCENTAGE') {
    throw new Error('Calculation type must be either a fixed amount or a percentage.');
  }
  if (calculationType === 'PERCENTAGE' && !['GROSS_SALARY', 'BASIC_SALARY', 'CTC'].includes(calculationBasis)) {
    throw new Error('Calculation basis must be % of Gross, % of Basic or % of CTC.');
  }
  if (calculationType === 'PERCENTAGE' && !((amountPercentage || 0) >= 0 && amountPercentage <= 100)) {
    throw new Error('Percentage must be between 0 and 100.');
  }
  if (calculationType === 'FIXED' && !((amountPercentage || 0) >= 0)) {
    throw new Error('Amount cannot be negative.');
  }

  // Current state of everything else — nothing here is re-derived from any rule, since
  // Basic itself isn't changing; only the target component's own basis is.
  const monthlyCtc = await findCommittedMonthlyCtc(employeeId);
  const { earnings: currentEarnings, grossSalary: currentGross, basicSalary } = resolveEarnings(
    salaryComponents,
    globalComponentsById,
    { monthlyCtc }
  );

  let percentageBase = basicSalary;
  if (calculationBasis === 'GROSS_SALARY') percentageBase = currentGross;
  // Same fallback as resolveEarnings when there's no committed CTC: % of Gross.
  else if (calculationBasis === 'CTC') percentageBase = monthlyCtc > 0 ? monthlyCtc : currentGross;
  const newTargetAmount =
    calculationType === 'FIXED' ? amountPercentage : ((amountPercentage || 0) / 100) * percentageBase;

  const sumOfOthers = currentEarnings
    .filter(
      (e) =>
        e.id !== targetComponent._id.toString() &&
        e.componentName !== 'Basic Salary' &&
        e.calculationType !== 'BALANCING' &&
        e.isPartOfGross !== false
    )
    .reduce((sum, e) => sum + e.calculatedAmount, 0);

  const availableForTarget = currentGross - basicSalary - sumOfOthers;
  const newSpecialAllowance = availableForTarget - newTargetAmount;
  if (newSpecialAllowance < 0) {
    throw new Error(
      `This doesn't fit: after Basic, HRA and the other components, only ₹${Math.round(availableForTarget)} / month of this CTC is left. Enter a smaller amount.`
    );
  }

  // A PERCENTAGE-type component stores the PERCENT itself in amountPercentage (e.g. 50),
  // not the rupee amount it resolves to (e.g. 19,610) — persisting newTargetAmount here
  // unconditionally would silently corrupt it into a nonsense percentage on the very next
  // read (resolveEarnings would compute (19610/100) * basic, wildly inflated). FIXED mode
  // has no such distinction — amountPercentage IS the rupee amount there.
  const targetPersistValue = calculationType === 'PERCENTAGE' ? amountPercentage : newTargetAmount;
  await persistComponentAmount(corporateUserID, employeeId, targetComponent, targetPersistValue, {
    calculationType,
    calculationBasis: calculationType === 'PERCENTAGE' ? calculationBasis : targetComponent.calculationBasis,
    // Same reasoning as redistributeBasicSalary's own edit target — a deliberate,
    // employee-specific deviation from the org's template, which must stick.
    overridesGlobalRule: true,
  });
  await persistComponentAmount(corporateUserID, employeeId, balancingComponent, newSpecialAllowance, {
    calculationType: 'BALANCING',
  });

  return {
    componentName: targetComponent.componentName,
    componentAmount: newTargetAmount,
    specialAllowance: newSpecialAllowance,
    grossSalary: currentGross,
  };
};


