const { getEmployeesUsingId } = require("../models/use-cases/employee");
const { findApprovedSalaries } = require("../models/use-cases/salary");

exports.verifyEffectiveDateForCompensationComponents = async (
  corporateUserID,
  employeeId,
  expenseDate,
  corporateUser // optional: when passed, the employee must belong to this corporate
) => {
  try {
    const employeeInfo = await getEmployeesUsingId(employeeId);
    if (
      corporateUser &&
      (!employeeInfo || employeeInfo instanceof Error || String(employeeInfo.corporateUser) !== String(corporateUser))
    ) {
      throw new Error("Employee not found");
    }
    const joiningDate = new Date(employeeInfo?.employeeInformation?.dateOfJoin);
    const expenseDateObj = new Date(expenseDate);
    
    const expenseMonth = expenseDateObj.getMonth() + 1; // getUTCMonth() returns 0-11, so add 1 to get 1-12
    const expenseYear = expenseDateObj.getFullYear();

    if (expenseDateObj < joiningDate) {
      throw new Error(
        "Date you have selected is earlier than the joining date of this employee"
      );
    }

    // let { payrollSettings: { salaryCycleDay, payrollStartsFrom } = {} } =
    //   await HrSettings.findOne({ corporateUser: corporateUserID });

    // if (
    //   salaryCycleDay === undefined ||
    //   typeof salaryCycleDay !== "number" ||
    //   !Number.isInteger(salaryCycleDay)
    // ) {
    //   throw new Error(
    //     "HR settings not found or invalid salary cycle day for this corporate user"
    //   );
    // }
    

    // if (expenseDateObj < payrollStartsFrom) {
    //   throw new Error(
    //     "The selected date is earlier than the payroll start date."
    //   );
    // }

    const { status, message } = await findApprovedSalaries(
      expenseMonth,
      expenseYear,
      corporateUserID
    );
    if (!status) throw new Error(message);

    return {
      status: true,
      message: "Success",
    };
  } catch (error) {
    return {
      status: false,
      message: error.message || "Something went wrong",
    };
  }
};
