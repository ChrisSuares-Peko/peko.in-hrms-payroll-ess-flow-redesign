const ComplianceSettings = require("../entities/complianceSettings");
const Salary = require("../entities/salary");
const Employee = require("../entities/employee");
const Form24 = require("../entities/form24q");
const { getCurrentEmployeeComponent } = require("./salaryComponent");
const { escapeSearch } = require('../../utils/escapeRegex');


exports.getSalaryTableData = async (corporateUserId, year, month) => {
    // Fetch corporate compliance settings
    const compliance = await ComplianceSettings.findOne({ corporateUser: corporateUserId });
    if (!compliance) throw new Error('Compliance settings not found.');

    // Fetch all active employees for this corporate user
    const employees = await Employee.find({
      corporateUser: corporateUserId,
      isEmployeeDeleted: false
    });
    console.log("employees!", corporateUserId);
    // Fetch salary records for these employees
    const salaryRecords = await Salary.find({
      corporateUser: corporateUserId,
      year,
      month
    });

    const tableData = [];

    for (const employee of employees) {
      const salaryRecord = salaryRecords.find(s => {
        console.log("Comparing:", {
          employeeIdInSalary: s.employee,
          employeeIdCurrent: employee._id,
          equal: s.employee.toString() === employee._id.toString()
        });
        return s.employee.toString() === employee._id.toString();
      });

      console.log("salaryRecord!", salaryRecord);
      console.log("Matched salaryRecord for employee:", employee._id.toString(), salaryRecord);
      // Fetch component data using your existing usecase
      const componentDataResult = await getCurrentEmployeeComponent({
        corporateUserID: corporateUserId,
        employeeId: employee._id
      });

      let taxableIncome = 0;
      let exemptions = 0;

      const exemptComponentNames = [
        'House Rent Allowance',
        'Leave Travel Allowance',
        'Conveyance Allowance',
        'Medical Allowance'
      ];

      if (componentDataResult && componentDataResult.componentData) {
        for (const comp of componentDataResult.componentData) {
          if (
            comp.componentName !== 'Gross Salary' &&
            comp.amount !== undefined &&
            typeof comp.amount === 'number'
          ) {
            taxableIncome += comp.amount;

            if (exemptComponentNames.includes(comp.componentName)) {
              exemptions += comp.amount;
            }
          }
        }
      } else {
        taxableIncome = salaryRecord?.salaryInformation?.basicPay || 0;
      }

      const monthlyTDSDeduction = salaryRecord?.salaryInformation?.tdsAmount || 0;

      const taxRegime =
        employee.otherConfigurations?.tdsRegime && employee.otherConfigurations?.tdsRegime !== ''
          ? employee.otherConfigurations.tdsRegime
          : (compliance.taxRegime || 'New Tax Regime');

      tableData.push({
        name: employee.personalInformation?.fullName || 'N/A',
        email: employee.personalInformation?.email || 'N/A',
        taxRegime,
        taxableIncome,
        exemptions,
        monthlyTDSDeduction
      });
    }

    return tableData;
};


exports.saveForm24Data = async (params) => {
  try {
    const { corporateUser, quarter, formData, s3FileUrl } = params;
    const financialYear = formData.financialYear;

    const existingEntry = await Form24.findOne({
      corporateUser,
      quarter,
      "data.financialYear": financialYear,
    });
    if (existingEntry) {

      throw new Error(
        `Form 24Q for the selected quarter and financial year already exists for this corporate user.`
      );
    }


    const formEntry = new Form24({
      corporateUser,

      quarter,
      data: formData,
      file: s3FileUrl
    });

    const savedEntry = await formEntry.save();
    return savedEntry



  } catch (error) {
    if (error.name === "ValidationError") {
      throw new Error(`Failed to save Form 24 data. Missing or invalid fields`);
    }
    throw new Error(error.message || 'Failed to save Form 24 data as required fields are missing');
    // console.error('Error saving Form 24 data:', error);

  }
};


exports.getForm24QByCorporateUser = async (corporateUserId, year, search) => {
  if (!corporateUserId) throw new Error('Corporate user ID is required');

  const query = { corporateUser: corporateUserId };

  if (year) {
    // financialYear is stored as a string like "2024-25", filter by year contained in it
    query['data.financialYear'] = { $regex: escapeSearch(year), $options: 'i' };
  }

  if (search) {
    const regex = { $regex: escapeSearch(search), $options: 'i' };
    query['$or'] = [
      { quarter: regex },
      { file: regex },
    ];
  }

  const forms = await Form24.find(query).sort({ createdAt: -1 });

  return forms;
};


