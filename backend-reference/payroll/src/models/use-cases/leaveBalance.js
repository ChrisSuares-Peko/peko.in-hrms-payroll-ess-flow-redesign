const { getMonthsElapsedInFiscalYear } = require("../../utils/leavePolicy");
const EmployeeLeaveBalance = require("../entities/leaveBalance");


const isNewFiscalYear = () => {
    const today = new Date();
    return today.getMonth() === 3 && today.getDate() === 1; // April 1
    
};

exports.createOrUpdateEmployeeLeaveBalance = async (employeeId, leavePolicies) => {
    let employeeLeaveBalance = await EmployeeLeaveBalance.findOne({ employee: employeeId });

    const computeInitialAvailableLeave = (policy) => {
        if (policy.accrualType === 'FIXED') {
            return parseFloat(policy.maximumNumberOfLeaves || '0');
        }
        else if (policy.accrualType === 'MONTHLY') {

            const monthsElapsed = getMonthsElapsedInFiscalYear(new Date());

            return Math.min(
                monthsElapsed * (Number(policy.accrualRate) || 0),
                Number(policy.maximumAccrual) ||
                Number(policy.maximumNumberOfLeaves) ||
                9999
            );
        }
        else if (policy.accrualType === 'DAILY') {

            const today = new Date();
            const startOfYear = new Date(today.getFullYear(), 0, 1);

            const daysElapsed =
                Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24)) + 1;

            return Math.min(
                daysElapsed * (Number(policy.accrualRate) || 0),
                Number(policy.maximumAccrual) ||
                Number(policy.maximumNumberOfLeaves) ||
                9999
            );
        }
        else if (policy.accrualType === 'YEARLY') {
            return Math.min(
                Number(policy.accrualRate) || 0,
                Number(policy.maximumAccrual) ||
                Number(policy.maximumNumberOfLeaves) ||
                9999
            );
        }
         else if (policy.accrualType === 'ACCRUAL') {
            const monthsElapsed = getMonthsElapsedInFiscalYear(new Date());
            const accrualRate = parseFloat(policy.accrualRate || '0');
            const maxAccrual = parseFloat(policy.maximumAccrual || '9999');
            return Math.min(monthsElapsed * accrualRate, maxAccrual);
        }
         return Number(policy.maximumNumberOfLeaves) || 0;
    };

    const today = new Date();

    if (!employeeLeaveBalance) {
        // Create new leave balance record
        employeeLeaveBalance = new EmployeeLeaveBalance({
            employee: employeeId,
            leavePolicies: leavePolicies.map(policy => ({
                leaveComponent: policy._id,
                availableLeave: computeInitialAvailableLeave(policy),
                carryOverBalance: 0,
                lastCarryoverDate: null,
            })),
        });
    } else {
        leavePolicies.forEach(policy => {
            const existingPolicy = employeeLeaveBalance.leavePolicies.find(
                (leavePolicy) => leavePolicy.leaveComponent.toString() === policy._id.toString()
            );

            if (!existingPolicy) {
                // New leave policy being added
                employeeLeaveBalance.leavePolicies.push({
                    leaveComponent: policy._id,
                    availableLeave: computeInitialAvailableLeave(policy),
                    carryOverBalance: 0,
                    lastCarryoverDate: null,
                });
            } else {
                // Carryover logic only if it's April 1 and not already done
                const isCarryoverAllowed = policy.leaveBalanceCarryover === 'ALLOWED';

                const lastCarryDate = existingPolicy.lastCarryoverDate;
                const hasNotBeenCarriedThisYear = !lastCarryDate ||
                    (lastCarryDate.getFullYear() < today.getFullYear());

                if (isNewFiscalYear() && isCarryoverAllowed && hasNotBeenCarriedThisYear) {
                    const unused = existingPolicy.availableLeave;
                    existingPolicy.carryOverBalance = unused;
                    existingPolicy.availableLeave += unused;
                    existingPolicy.lastCarryoverDate = today;
                }
            }
        });
    }

    await employeeLeaveBalance.save();
    console.log('Employee leave balance created/updated successfully!');
};
