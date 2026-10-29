const DeductionComponent = require("../entities/deductionComponent");
const ComplianceSettings = require("../entities/complianceSettings");
const asyncHandler = require("../../middleware/async");
const {defaultDeductionComponents} = require('../../utils/defaultSalaryComponents');
const { resolveEpfPolicyFromComplianceSettings, resolvePfMonthlyCap, isEpfApplicableForPeriod } = require('../../services/calculateEmployerPf');
const {
    getEmployeeGrossSalary,
    calculateSingleDeductionAmount,
    isProvidentFundDeduction,
} = require('./salaryComponent');
const { ensureProvidentFundDeductionExists } = require('./complianceSettings');
const { escapeSearch } = require('../../utils/escapeRegex');
const { markSalaryStale } = require('../../services/salaryStaleMarker');

 
// Flips an employee's effective deduction row (by name, e.g. "Provident Fund (PF)" or
// "ESI") Active/Inactive — used when a Statutory Components toggle (EPF/ESI enabled) is
// switched, so what the Deduction Components tab shows always matches the toggle.
// Creates an employee-specific override (copying the global row's calc fields) the first
// time a row needs to be toggled off; reuses it (just flips status) after that. If no
// component with this name exists at all for the org (global or employee-specific),
// there's nothing to flip and this is a no-op.
exports.setEmployeeDeductionActiveByName = async ({ corporateUserID, employeeId, deductionName, active }) => {
    const status = active ? 'ACTIVE' : 'INACTIVE';

    const employeeOverride = await DeductionComponent.findOne({
        corporateUser: corporateUserID,
        employee: employeeId,
        deductionName,
    });

    if (employeeOverride) {
        employeeOverride.status = status;
        return employeeOverride.save();
    }

    const globalComponent = await DeductionComponent.findOne({
        corporateUser: corporateUserID,
        isGlobal: true,
        employee: null,
        deductionName,
    });

    if (!globalComponent) {
        return null;
    }

    return exports.createEmployeeDeductionComponent({
        corporateUser: corporateUserID,
        employee: employeeId,
        globalComponentId: globalComponent._id,
        deductionName: globalComponent.deductionName,
        calculationType: globalComponent.calculationType,
        amountPercentage: globalComponent.amountPercentage,
        calculationBasis: globalComponent.calculationBasis,
        salaryDeductionType: globalComponent.salaryDeductionType,
        status,
        isGlobal: false,
    });
};

exports.createDeductionComponent = async (data) => {
    try {
        const newDeductionComponent = new DeductionComponent(data);
        const savedDeductionComponent = await newDeductionComponent.save();
        return savedDeductionComponent;
 
    } catch (error) {
        console.log(error);
        return error;
    }
};
exports.createEmployeeDeductionComponent = async (data) => {
    try {
        const deductionComponent = new DeductionComponent(data);
        const savedDeduction = await deductionComponent.save();
        return savedDeduction;
    } catch (error) {
        throw new Error(error.message || 'Error creating deduction component');
    }
};


// update deduction component when employee ID is present

exports.updateDeductionComponent = async ({ id, corporateUserID, employeeId, updateFields }) => {
    
    let deductionComponent = await DeductionComponent.findOne({ _id: id, corporateUser: corporateUserID });
    if (!deductionComponent) {
        throw new Error('Deduction component not found');
    }

    const isGlobal = deductionComponent.isGlobal;

    if (isGlobal && employeeId) {

        let employeeSpecificComponent = await DeductionComponent.findOne({
            corporateUser: corporateUserID,
            employee: employeeId,
            globalComponentId: id,
        });

        // Self-healing fallback: an override created before it was ever linked to this
        // global row (e.g. a standalone deduction created during Add Employee onboarding,
        // with no globalComponentId set) won't match the id-based lookup above — falling
        // back to a name match here means editing it links + updates that SAME row instead
        // of spawning a second, duplicate override for the same deduction (which is what
        // used to happen: "Provident Fund (PF)" showing twice, doubling Total Deductions).
        if (!employeeSpecificComponent) {
            employeeSpecificComponent = await DeductionComponent.findOne({
                corporateUser: corporateUserID,
                employee: employeeId,
                deductionName: deductionComponent.deductionName,
                isGlobal: false,
            });
        }

        if (employeeSpecificComponent) {

            employeeSpecificComponent = await DeductionComponent.findOneAndUpdate(
                { _id: employeeSpecificComponent._id, corporateUser: corporateUserID },
                { ...updateFields, globalComponentId: id },
                { new: true, runValidators: true }
            );
            return {
                status: 'updated',
                component: employeeSpecificComponent,
            };
        } else {
            
            const newEmployeeSpecificComponent = new DeductionComponent({
                ...updateFields,
                corporateUser: corporateUserID,
                employee: employeeId,
                isGlobal: false, // Mark it as an employee-specific component
                globalComponentId: id, 
            });
            const result = await newEmployeeSpecificComponent.save();
            return {
                status: 'created',
                component: result,
            };
        }
    } else if (!isGlobal) {
        
        deductionComponent = await DeductionComponent.findOneAndUpdate(
            { _id: id, corporateUser: corporateUserID },
            { ...updateFields },
            { new: true, runValidators: true }
        );
        return {
            status: 'updated',
            component: deductionComponent,
        };
    } else {
 
        deductionComponent = await DeductionComponent.findOneAndUpdate(
            { _id: id, corporateUser: corporateUserID },
            { ...updateFields },
            { new: true, runValidators: true }
        );
        return {
            status: 'updated',
            component: deductionComponent,
        };
    }
};

exports.getAllDeductionComponents = asyncHandler(async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText.trim() || '';
        const skip = (page - 1) * limit;

        // PF is now seeded as a default deduction component alongside the org's default
        // salary components (see getAllSalaryComponents/getCurrentComponent/
        // getEmployeeSalaryComponentListByEmail), but that happens on a separate,
        // independently-timed request from this one — Add Employee's Salary Information
        // step fetches earnings and deductions in parallel, so this read can't assume the
        // other request's write has already landed. Self-heal here too, same as every
        // other reader of this row (getEmployeeDeductionComponentsList, ctcCalculator.js,
        // bulkEmployeeCtc.js), so an includePf-flagged CTC-preview read is correct on its
        // own regardless of request ordering.
        if (params.includePf) {
            await ensureProvidentFundDeductionExists(params.corporateUserID);
        }

        const queryConditions = {
            corporateUser: params.corporateUserID,
            isGlobal: true,
            globalComponentId:null,
            // PF is driven by Compliance Settings > EPF, not this list — hide it here even
            // for orgs whose global PF row was seeded before this change (or re-seeded by
            // the ensureProvidentFundDeductionExists safety net in complianceSettings.js).
            // getEmployeeDeductionComponentsList (the real calculation path) is untouched.
            // includePf opts back in for CTC-preview consumers (Dashboard Calculator, Add
            // Employee, New Hire) that reuse this same list to seed their starting
            // structure — without it PF silently disappears from those previews entirely,
            // even though it's still calculated correctly for real employees either way.
            ...(params.includePf ? {} : { deductionName: { $ne: 'Provident Fund (PF)' } }),
            $or: [
                { deductionName: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                { category: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                { calculationType: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
                { status: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } },
            ]
        };
        let componentData = await DeductionComponent.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();
        if (componentData.length === 0 && !searchText && page === 1 ) {
            const defaultComponents = defaultDeductionComponents(params.corporateUserID);
            componentData = await DeductionComponent.insertMany(defaultComponents);
            await markSalaryStale({
                corporateUserID: params.corporateUserID,
                reason: 'Default deduction components seeded',
            });
        }
        const totalCount = await DeductionComponent.countDocuments(queryConditions);
        return {
            totalCount,
            componentData
 
        }
    } catch (error) {
        return (error);
    }
});
exports.getEmployeeDeductionComponents = asyncHandler(async (params) => {
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
 
       
 
        const componentData = await DeductionComponent.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();
 
        const totalCount = await DeductionComponent.countDocuments(queryConditions);
        return {
            totalCount,
            componentData
 
        }
    } catch (error) {
        return (error);
    }
});
exports.editDeductionComponent = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const componentId = params.componentId;
        const editData = params.editData
 
        const query = {
            _id: componentId,
            corporateUser: corporateUserID
        }
        const editDeductionComponent = await DeductionComponent.updateOne(query, editData);
 
        return editDeductionComponent;
 
    } catch (error) {
        return error
    }
});
exports.deleteDeductionComponent = asyncHandler(async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const componentId = params.componentId;
 
        const deleteDeductionComponent = await DeductionComponent.findOneAndDelete({
            _id: componentId,
            corporateUser: corporateUserID
        });
 
        return deleteDeductionComponent;
 
    } catch (error) {
        return error
    }
});


exports.getEmployeeDeductionComponentsList = asyncHandler(async (params) => {
    try {

        const queryConditions = {
            corporateUser: params.corporateUserID,
            employee: params.employeeId,
            isGlobal:false
        };


        let globalComponentData = await DeductionComponent.find({
            corporateUser: params.corporateUserID,
            employee: null, // Indicates global component
            isGlobal:true,
             status:"ACTIVE"
        });

        const employeeComponentData = await DeductionComponent.find(queryConditions);

        const overriddenGlobalIds = new Set(
            employeeComponentData
              .filter(item => item.globalComponentId)
              .map(item => item.globalComponentId.toString())
          );

        // Neither DeductionComponent nor the ensureProvidentFundDeductionExists
        // check-then-create it relies on enforces a uniqueness constraint on
        // deductionName, so a race between two concurrent requests for the same org
        // (e.g. Add Employee's parallel earnings/deductions fetches, both racing to
        // lazily create the org's first PF row) can leave two global "Provident Fund
        // (PF)" documents behind — this is the real payroll calculation path, so
        // without this, that doubles the employee's actual PF deduction, not just a
        // display glitch. Keep only one ACTIVE occurrence of each name, same convention
        // as the frontend CTC calculator's dedupeByName — but prefer whichever duplicate
        // an existing employee override actually points at via globalComponentId (if
        // any), since find() has no guaranteed order and blindly keeping "whichever
        // came first" can keep the WRONG duplicate — one the override doesn't
        // reference — leaving both it and the override in the final list.
        const seenGlobalByName = new Map();
        for (const item of globalComponentData) {
            const doc = item.toObject ? item.toObject() : item;
            const name = (doc.deductionName || '').trim().toLowerCase();
            if (!name) continue;
            const existing = seenGlobalByName.get(name);
            if (!existing) {
                seenGlobalByName.set(name, item);
                continue;
            }
            const currentIsReferenced = overriddenGlobalIds.has(item._id.toString());
            const existingIsReferenced = overriddenGlobalIds.has(existing._id.toString());
            if (currentIsReferenced && !existingIsReferenced) {
                seenGlobalByName.set(name, item);
            }
        }
        globalComponentData = [...seenGlobalByName.values()];

        // Guarantees PF is deducted even for an org that's never explicitly saved
        // Compliance Settings > EPF — see ensureProvidentFundDeductionExists's comment.
        // Checked against what was just fetched (rather than an unconditional call) so a
        // normal request — PF already present — costs no extra query.
        const hasGlobalPf = globalComponentData.some((item) => {
            const doc = item.toObject ? item.toObject() : item;
            return isProvidentFundDeduction(doc.deductionName);
        });
        if (!hasGlobalPf) {
            const pfDoc = await ensureProvidentFundDeductionExists(params.corporateUserID);
            globalComponentData = [...globalComponentData, pfDoc];
        }
          // Self-healing fallback for an employee override created before it was ever
          // linked to its global template (globalComponentId still null) — without this,
          // that template never gets excluded below, so the SAME deduction shows up
          // twice: once as the org default, once as the employee's own override.
          const overriddenGlobalNames = new Set(
            employeeComponentData
              .filter(item => !item.globalComponentId && item.deductionName)
              .map(item => item.deductionName.trim().toLowerCase())
          );

          // Filter global components to exclude overridden ones
          const filteredGlobalComponents = globalComponentData.filter(
            item =>
              !overriddenGlobalIds.has(item._id.toString()) &&
              !overriddenGlobalNames.has((item.deductionName || '').trim().toLowerCase())
          );
          
          // Combine the result
          let combinedComponentData = [...filteredGlobalComponents, ...employeeComponentData];

          const { basicSalary = 0, totalEarnings = 0 } = await getEmployeeGrossSalary({
            corporateUserID: params.corporateUserID,
            employeeId: params.employeeId,
          });

          // The org's PF wages policy decides whether the statutory ceiling applies at
          // all — auto-capping unconditionally here would silently override an org that's
          // explicitly configured FULL_BASIC (no cap) the first time this ran for each
          // employee, permanently freezing their PF at the cap regardless of what was
          // actually chosen in Compliance Settings.
          const complianceSettings = await ComplianceSettings.findOne({ corporateUser: params.corporateUserID }).lean();
          const pfPolicy = resolveEpfPolicyFromComplianceSettings(complianceSettings);
          // Establishment EPF switched off — PF doesn't apply to anyone, so it's left out of
          // this employee's list (their own PF row/toggle stays as saved, untouched).
          if (!isEpfApplicableForPeriod(complianceSettings)) {
            combinedComponentData = combinedComponentData.filter((component) => {
              const doc = component.toObject ? component.toObject() : component;
              return !isProvidentFundDeduction(doc.deductionName);
            });
          }
          // "Right now" — this freezes a LIVE component override, not a specific historical
          // payroll month, so it always uses whichever ceiling (₹15,000/₹25,000) is
          // currently in force.
          const currentPfMonthlyCap = resolvePfMonthlyCap();

          // First time this employee's 12%-of-basic PF (still inheriting the global
          // template — no employee-specific override yet) exceeds the statutory ceiling,
          // persist a fixed, employee-specific override at the capped amount so it stops
          // being recalculated off the global percentage on every fetch. Only when the
          // org's policy actually caps PF wages — skipped entirely for FULL_BASIC.
          combinedComponentData = await Promise.all(
            combinedComponentData.map(async (component) => {
              const doc = component.toObject ? component.toObject() : component;
              const isUncappedGlobalPF =
                pfPolicy === 'CAPPED_15000' &&
                doc.isGlobal &&
                doc.calculationType === 'PERCENTAGE' &&
                isProvidentFundDeduction(doc.deductionName);

              if (isUncappedGlobalPF) {
                const uncappedAmount = (Number(doc.amountPercentage || 0) / 100) * basicSalary;
                if (uncappedAmount > currentPfMonthlyCap) {
                  const overrideDoc = await DeductionComponent.create({
                    corporateUser: params.corporateUserID,
                    employee: params.employeeId,
                    deductionName: doc.deductionName,
                    calculationType: 'FIXED',
                    amountPercentage: currentPfMonthlyCap,
                    calculationBasis: doc.calculationBasis || 'MONTHLY',
                    salaryDeductionType: doc.salaryDeductionType,
                    status: 'ACTIVE',
                    isGlobal: false,
                    globalComponentId: doc._id,
                  });
                  await markSalaryStale({
                    corporateUserID: params.corporateUserID,
                    employeeIds: [params.employeeId],
                    reason: 'PF cap override created',
                  });
                  return overrideDoc.toObject();
                }
              }
              return doc;
            })
          );

          // Resolve each component's actual monthly amount (PERCENTAGE components are
          // computed against basic/gross salary) so the list can display the real
          // amount instead of just the raw percentage.
          const componentDataWithAmount = combinedComponentData.map((doc) => ({
            ...doc,
            id: doc.id ?? doc._id?.toString(),
            calculatedAmount: calculateSingleDeductionAmount({
              calculationType: doc.calculationType,
              amountPercentage: doc.amountPercentage,
              calculationBasis: doc.calculationBasis,
              salaryDeductionType: doc.salaryDeductionType,
              deductionName: doc.deductionName,
              basicSalary,
              grossSalaryBase: totalEarnings,
              pfPolicy,
              globalComponentId: doc.globalComponentId,
            }),
          }));

          return {
            componentData: componentDataWithAmount,
            totalCount : componentDataWithAmount.length
          };


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
        // const totalCount = combinedComponentData.length;
        // return {
        //     componentData: combinedComponentData,
        //     totalCount
        // };
    } catch (error) {
        return error;
    }
});
