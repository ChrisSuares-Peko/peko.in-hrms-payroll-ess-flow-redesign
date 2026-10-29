const asyncHandler = require("../middleware/async");
const { createForm16A, createForm16B,getForm16A,getForm16B,checkExistingForm16A, checkExistingForm16B,downloadForm16,getTdsDetails,getTdsList} = require("../models/use-cases/form16");
// const { getEmployeesUsingId} = require("../models/use-cases/employee");
const form16A = require("../models/entities/form16A");
const ErrorResponse = require('../utils/error-response');
const { isEmployeeOfCorporate } = require('../utils/tenantScope');
const { generateExcelBufferAndType } = require('../utils/documentToBuffer');


exports.fetchForm16AUsingId = asyncHandler(async (req, res, next) => {

    const { overtimeId } = req.params;
    let overtimeData = await form16A.findOne({ _id: overtimeId })
    // Form16A has no corporateUser field; ownership is through its employee.
    if (overtimeData && !(await isEmployeeOfCorporate(overtimeData.employee, req.user._id))) {
        overtimeData = null;
    }
    if (!overtimeData) {
        return next(new ErrorResponse('something went wrong while fetching Form16A data', 400));
    } else {
        return res.status(201).json({
            status: true,
            data: overtimeData,
            message: 'Form16A data fetched successfully',
            responseCode: '000'
        })
    }

})

exports.getForm16A = asyncHandler(async (req, res) => {

    const {employee,assessmentYear} = req.query;

    if ([employee, assessmentYear].some((v) => v !== undefined && typeof v !== 'string')) {
        throw new ErrorResponse('Invalid query parameters', 400);
    }

    if (!(await isEmployeeOfCorporate(employee, req.user._id))) {
        return res.status(404).json({
            status: false,
            responseCode: '404',
            message: 'Form16A data not found',
        });
    }

    const result = await getForm16A(employee,assessmentYear);

     // If result is an error object
    if (result instanceof Error) {
      console.log (result)
      return res.status(201).json({
        status: false,
        responseCode: "001",
        message: "something went wrong while generating Form16A data",
        data: {},
      });
    }

    // If no data found
    if (!result) {
        return res.status(404).json({
            status: false,
            responseCode: '404',
            message: 'Form16A data not found',
        });
    }

    // Success
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Form16A data fetched successfully',
        data: result
    });
})

exports.createForm16A = async (req, res) => {
  const form16AData = req.body;

  /* … all your destructuring stays the same … */

  const employee = form16AData.employeeId;
  const assessmentYear = form16AData.assessmentYear;

  try {
    /* ----------------------------------------------------
       1. Validate Employee
    ----------------------------------------------------- */
    const employeePresent = await isEmployeeOfCorporate(employee, req.user._id);

    if (!employeePresent) {
      return res.status(400).json({
        status: false,
        data: {},
        message: "Employee ID does not exists",
        responseCode: "001",
      });
    }

    /* ----------------------------------------------------
       2. Check if Form16A already exists
    ----------------------------------------------------- */
    const existingRecord = await checkExistingForm16A(employee, assessmentYear);

    /* ----------------------------------------------------
       3. If exists → UPDATE
    ----------------------------------------------------- */
    if (existingRecord) {
      existingRecord.employeeDetails = { ...form16AData.employeeDetails };
      existingRecord.employerDetails = { ...form16AData.employerDetails };
      existingRecord.quarterSummary = form16AData.quarterSummary || [];
      existingRecord.bookAdjustments = form16AData.bookAdjustments || [];
      existingRecord.challans = form16AData.challans || [];
      existingRecord.createdBy = req.user?._id;

      const updated = await existingRecord.save();

      return res.status(200).json({
        status: true,
        responseCode: "000",
        message: "Form 16A updated successfully",
        data: updated,
      });
    }

    /* ----------------------------------------------------
       4. Else → CREATE
    ----------------------------------------------------- */
    const payload = {
      employee,
      assessmentYear,
      createdBy: req.user?._id,
      employeeDetails: form16AData.employeeDetails,
      employerDetails: form16AData.employerDetails,
      quarterSummary: form16AData.quarterSummary || [],
      bookAdjustments: form16AData.bookAdjustments || [],
      challans: form16AData.challans || []
    };

    const newRecord = await createForm16A(payload);

    return res.status(201).json({
      status: true,
      responseCode: "000",
      message: "Form 16A created successfully",
      data: newRecord,
    });

  } catch (error) {
    console.error("Error in create/update Form16A:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      responseCode: "500",
    });
  }
};

// exports.createForm16A  = async (req, res) => {

//   // Use req.body directly (because you are sending plain JSON)
//   const form16AData = req.body;

//   /* ----------------------------------------------------
//      Destructure employee details
//   ----------------------------------------------------- */
//   const {
//     name: employeeName,
//     address: employeeAddress,
//     pan: employeePAN,
//     tan: employeeTAN,
//     employeeRefNo
//   } = form16AData.employeeDetails || {};
//   const employee= form16AData.employeeId , assessmentYear =form16AData.assessmentYear;
//   /* ----------------------------------------------------
//      Destructure employer details
//   ----------------------------------------------------- */
//   const {
//     name: employerName,
//     address: employerAddress,
//     pan: employerPAN,
//     periodStart,
//     periodEnd,
//     certificateNumber,
//     updatedDate,
//     citAddress
//   } = form16AData.employerDetails || {};

//   /* ----------------------------------------------------
//      Destructure tables (arrays)
//   ----------------------------------------------------- */
//   const quarterSummary = form16AData.quarterSummary || [];
//   const bookAdjustments = form16AData.bookAdjustments || [];
//   const challans = form16AData.challans || [];

//   const corporateUser = req.user?._id;

//   try {
//     const form16AId = req.params.form16AId;
//     let existingRecord;

//     /* ----------------------------------------------------
//        UPDATE FLOW
//     ----------------------------------------------------- */
//     // if (form16AId) {
//     //   existingRecord = await Form16A.findById(form16AId);

//     //   if (!existingRecord) {
//     //     return res.status(404).json({
//     //       status: false,
//     //       message: "Form 16A record not found",
//     //       responseCode: "404",
//     //     });
//     //   }

//     //   existingRecord.employeeDetails = {
//     //     name: employeeName,
//     //     address: employeeAddress,
//     //     pan: employeePAN,
//     //     tan: employeeTAN,
//     //     employeeRefNo
//     //   };

//     //   existingRecord.employerDetails = {
//     //     name: employerName,
//     //     address: employerAddress,
//     //     pan: employerPAN,
//     //     periodStart,
//     //     periodEnd,
//     //     certificateNumber,
//     //     updatedDate,
//     //     citAddress
//     //   };

//     //   existingRecord.quarterSummary = quarterSummary;
//     //   existingRecord.bookAdjustments = bookAdjustments;
//     //   existingRecord.challans = challans;

//     //   const updatedRecord = await existingRecord.save();

//     //   return res.status(200).json({
//     //     status: true,
//     //     responseCode: "000",
//     //     message: "Form 16A updated successfully",
//     //     data: updatedRecord,
//     //   });
//     // }

//     /* ----------------------------------------------------
//        CREATE FLOW
//     ----------------------------------------------------- */
//     const payload = {
//       employee,
//       assessmentYear,
//       corporateUser,
//       employeeDetails: {
//         name: employeeName,
//         address: employeeAddress,
//         pan: employeePAN,
//         tan: employeeTAN,
//         employeeRefNo
//       },
//       employerDetails: {
//         name: employerName,
//         address: employerAddress,
//         pan: employerPAN,
//         periodStart,
//         periodEnd,
//         certificateNumber,
//         updatedDate,
//         citAddress
//       },
//       quarterSummary,
//       bookAdjustments,
//       challans
//     };
//     const employeePresent = await getEmployeesUsingId(employee);
//     if (!employeePresent){
//          return res.status(400).json({
//                 status: false,
//                 data: {},
//                 message: "Employee ID does not exists",
//                 responseCode: '001'
//             });
//     }
//     const newRecord = await createForm16A(payload);

//     return res.status(201).json({
//       status: true,
//       responseCode: "000",
//       message: "Form 16A created successfully",
//       data: newRecord,
//     });

//   } catch (error) {
//     console.error("Error in create/update Form16A:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong",
//       responseCode: "500",
//     });
//   }
// };


// exports.createForm16B = async (req, res) => {
//   // Incoming raw JSON
//   const form16BData = req.body;

//   /* ----------------------------------------------------
//      Extract basic fields
//   ----------------------------------------------------- */
//   const employee = form16BData.employeeId;
//   const assessmentYear = form16BData.assessmentYear;
//   const corporateUser = req.user?._id; // logged-in user

//   /* ----------------------------------------------------
//      Destructure employeeDetails
//   ----------------------------------------------------- */
//   const {
//     name: employeeName,
//     address: employeeAddress,
//     pan: employeePAN,
//     tan: employeeTAN,
//     employeeRefNo
//   } = form16BData.employeeDetails || {};

//   /* ----------------------------------------------------
//      Destructure employerDetails
//   ----------------------------------------------------- */
//   const {
//     name: employerName,
//     address: employerAddress,
//     pan: employerPAN,
//     periodStart,
//     periodEnd,
//     certificateNumber,
//     updatedDate,
//     citAddress
//   } = form16BData.employerDetails || {};

//   /* ----------------------------------------------------
//      Destructure dynamic tables
//   ----------------------------------------------------- */
//   const salaryIncome = form16BData.salaryIncome || {};
//   const deductions16 = form16BData.deductions16 || {};
//   const otherIncome = form16BData.otherIncome || {};
//   const chapterVia = form16BData.chapterVia || [];

//   const quarterSummary = form16BData.quarterSummary || [];
//   const bookAdjustments = form16BData.bookAdjustments || [];
//   const challans = form16BData.challans || [];

//   const taxComputation = form16BData.taxComputation || {};
//   const verification = form16BData.verification || {};

//   try {
//     const form16BId = req.params.form16BId;
//     let existingRecord;

//     /* ----------------------------------------------------
//        UPDATE FLOW
//     ----------------------------------------------------- */
//     if (form16BId) {
//       existingRecord = await Form16B.findById(form16BId);

//       if (!existingRecord) {
//         return res.status(404).json({
//           status: false,
//           message: "Form 16B record not found",
//           responseCode: "404"
//         });
//       }

//       existingRecord.employee = employee;
//       existingRecord.assessmentYear = assessmentYear;

//       existingRecord.employeeDetails = {
//         name: employeeName,
//         address: employeeAddress,
//         pan: employeePAN,
//         tan: employeeTAN,
//         employeeRefNo
//       };

//       existingRecord.employerDetails = {
//         name: employerName,
//         address: employerAddress,
//         pan: employerPAN,
//         periodStart,
//         periodEnd,
//         certificateNumber,
//         updatedDate,
//         citAddress
//       };

//       existingRecord.salaryIncome = salaryIncome;
//       existingRecord.deductions16 = deductions16;
//       existingRecord.otherIncome = otherIncome;
//       existingRecord.chapterVia = chapterVia;

//       existingRecord.quarterSummary = quarterSummary;
//       existingRecord.bookAdjustments = bookAdjustments;
//       existingRecord.challans = challans;

//       existingRecord.taxComputation = taxComputation;
//       existingRecord.verification = verification;

//       const updatedRecord = await existingRecord.save();

//       return res.status(200).json({
//         status: true,
//         responseCode: "000",
//         message: "Form 16B updated successfully",
//         data: updatedRecord
//       });
//     }

//     /* ----------------------------------------------------
//        CREATE FLOW
//     ----------------------------------------------------- */
//     const employeePresent = await getEmployeesUsingId(employee);
//     if (!employeePresent){
//          return res.status(400).json({
//                 status: false,
//                 data: {},
//                 message: "Employee ID does not exists",
//                 responseCode: '001'
//             });
//     }
//     const payload = {
//       employee,
//       assessmentYear,
//       createdBy: corporateUser,

//       employeeDetails: {
//         name: employeeName,
//         address: employeeAddress,
//         pan: employeePAN,
//         tan: employeeTAN,
//         employeeRefNo
//       },

//       employerDetails: {
//         name: employerName,
//         address: employerAddress,
//         pan: employerPAN,
//         periodStart,
//         periodEnd,
//         certificateNumber,
//         updatedDate,
//         citAddress
//       },

//       salaryIncome,
//       deductions16,
//       otherIncome,
//       chapterVia,

//       quarterSummary,
//       bookAdjustments,
//       challans,

//       taxComputation,
//       verification
//     };

//     const newRecord = await createForm16B(payload);

//     return res.status(201).json({
//       status: true,
//       responseCode: "000",
//       message: "Form 16B created successfully",
//       data: newRecord
//     });

//   } catch (error) {
//     console.error("Error in create/update Form16B:", error);
//     return res.status(500).json({
//       status: false,
//       message: "Something went wrong",
//       responseCode: "500"
//     });
//   }
// };


exports.createForm16B = async (req, res) => {
  const form16BData = req.body;

  /* ----------------------------------------------------
     Basic fields
  ----------------------------------------------------- */
  const employee = form16BData.employeeId;
  const assessmentYear = form16BData.assessmentYear;
  const corporateUser = req.user?._id;

  /* ----------------------------------------------------
     Destructure objects
  ----------------------------------------------------- */
  const employeeDetails = form16BData.employeeDetails || {};
  const employerDetails = form16BData.employerDetails || {};

  const salaryIncome = form16BData.salaryIncome || {};
  const deductions16 = form16BData.deductions16 || {};
  const otherIncome = form16BData.otherIncome || {};
  const chapterVia = form16BData.chapterVia || [];

  const quarterSummary = form16BData.quarterSummary || [];
  const bookAdjustments = form16BData.bookAdjustments || [];
  const challans = form16BData.challans || [];

  const taxComputation = form16BData.taxComputation || {};
  const verification = form16BData.verification || {};
  const incomeChargableAtSalary = form16BData.incomeChargableAtSalary || {};
  const grossTotalIncome = form16BData.grossTotalIncome || {};
  const totalIncome = form16BData.totalIncome || {};

  try {
    /* ----------------------------------------------------
       1. Validate employee exists
    ----------------------------------------------------- */
    const employeePresent = await isEmployeeOfCorporate(employee, req.user._id);

    if (!employeePresent) {
      return res.status(400).json({
        status: false,
        message: "Employee ID does not exist",
        responseCode: "001",
        data: {},
      });
    }

    /* ----------------------------------------------------
       2. Check existing record (employee + assessmentYear)
    ----------------------------------------------------- */
    const existingRecord = await checkExistingForm16B(employee, assessmentYear);

    /* ----------------------------------------------------
       3. If exists → UPDATE
    ----------------------------------------------------- */
    if (existingRecord) {
      existingRecord.employee = employee;
      existingRecord.assessmentYear = assessmentYear;
      existingRecord.createdBy = corporateUser;

      existingRecord.employeeDetails = employeeDetails;
      existingRecord.employerDetails = employerDetails;

      existingRecord.salaryIncome = salaryIncome;
      existingRecord.deductions16 = deductions16;
      existingRecord.otherIncome = otherIncome;
      existingRecord.chapterVia = chapterVia;

      existingRecord.quarterSummary = quarterSummary;
      existingRecord.bookAdjustments = bookAdjustments;
      existingRecord.challans = challans;

      existingRecord.incomeChargableAtSalary = incomeChargableAtSalary;

      existingRecord.taxComputation = taxComputation;
      existingRecord.verification = verification;
      existingRecord.grossTotalIncome = grossTotalIncome;
      existingRecord.totalIncome = totalIncome;

      const updated = await existingRecord.save();

      return res.status(200).json({
        status: true,
        responseCode: "000",
        message: "Form 16B updated successfully",
        data: updated,
      });
    }

    /* ----------------------------------------------------
       4. ELSE → CREATE NEW RECORD
    ----------------------------------------------------- */
    const payload = {
      employee,
      assessmentYear,
      createdBy: corporateUser,
      employeeDetails,
      employerDetails,
      salaryIncome,
      deductions16,
      otherIncome,
      chapterVia,
      quarterSummary,
      bookAdjustments,
      challans,
      taxComputation,
      verification,
    };

    const newRecord = await createForm16B(payload);

    return res.status(201).json({
      status: true,
      responseCode: "000",
      message: "Form 16B created successfully",
      data: newRecord,
    });

  } catch (error) {
    console.error("Error in create/update Form16B:", error);
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      responseCode: "500",
    });
  }
};

exports.getForm16B = asyncHandler(async (req, res) => {

    const {employee,assessmentYear} = req.query;

    if ([employee, assessmentYear].some((v) => v !== undefined && typeof v !== 'string')) {
        throw new ErrorResponse('Invalid query parameters', 400);
    }

    if (!(await isEmployeeOfCorporate(employee, req.user._id))) {
        return res.status(404).json({
            status: false,
            responseCode: '404',
            message: 'Form16B data not found',
        });
    }

    const result = await getForm16B(employee,assessmentYear);

    // If result is an error object
    if (result instanceof Error) {
      console.log (result)
      return res.status(201).json({
        status: false,
        responseCode: "001",
        message: "something went wrong while generating form16B data",
        data: {},
      });
    }

    // If no data found
    if (!result) {
        return res.status(404).json({
            status: false,
            responseCode: '404',
            message: 'Form16B data not found',
        });
    }

    // Success
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Form16B data fetched successfully',
        data: result
    });

})

exports.getPdfForm16 = asyncHandler(async (req, res, next) => {
  try {
    const { employee, assessmentYear, formType } = req.query;

    if ([employee, assessmentYear].some((v) => v !== undefined && typeof v !== 'string')) {
        return next(new ErrorResponse('Invalid query parameters', 400));
    }
    let existingForm16A, existingForm16B;
    if (!(await isEmployeeOfCorporate(employee, req.user._id))) {
      return res.status(400).json({
        status: false,
        responseCode: "001",
        message: "Form 16 Details Not Found",
        data: {},
      });
    }
    if ((formType).toUpperCase() === 'FORM16B') {
      existingForm16B = await getForm16B(employee, assessmentYear);
    }
    else {
      existingForm16A = await getForm16A(employee, assessmentYear);
    }

    if (!existingForm16A && !existingForm16B) {
      return res.status(400).json({
        status: false,
        responseCode: "001",
        message: "Form 16 Details Not Found",
        data: {},
      });
    }

    let { status, message, data } = await downloadForm16({ existingForm16A, existingForm16B, formType })
    if (!status) {
      return next(new ErrorResponse(message, 400));
    }
    return res.status(200).json({
      status: true,
      responseCode: '000',
      message: 'Form 16 fetch successfully ',
      data
    });
  } catch (error) {
    console.log("error")
  }


})

exports.getTdsDetails = asyncHandler(async (req, res) => {
  try {
    const corporateUserID = req.user._id;
    const { employee, month, year } = req.query;
    const tdsDetails = await getTdsDetails({corporateUserID, employee, month, year});
    if (!tdsDetails) {
      return res.status(400).json({
        status: false,
        responseCode: "001",
        message: "Tds Details Not Found",
        data: {},
      });
    }
    return res.status(200).json({
      status: true,
      responseCode: '000',
      message: 'Tds fetch successfully ',
      tdsDetails
    });
  } catch (error) {
    console.log("error",error)
  }
})

exports.getTdsListExcel = asyncHandler(async (req, res) => {
  try {
    const corporateUserID = req.user._id;
    const { year, regimeType } = req.query;
    const rawMonth = req.query.month;
    const month = (rawMonth && rawMonth !== 'null' && rawMonth !== 'undefined') ? rawMonth : null;

    const tdsDetails = await getTdsList({ corporateUserID, month, year, regimeType });

    if (!tdsDetails || tdsDetails.length === 0) {
      return res.status(400).json({
        status: false,
        responseCode: "001",
        message: "No TDS data found to export",
        data: {},
      });
    }

    const excelData = tdsDetails.map((row) => ({
      "Employee Name":    row.name          || "",
      "Email":            row.email         || "",
      "Tax Regime":       row.taxRegime     || "",
      "TDS Frequency":    row.tdsFrequency  || "",
      "Taxable Income":   row.taxableIncome || 0,
      "Exemptions":       row.exemptions    || 0,
      "TDS Deduction":    row.tdsDeduction  || 0,
    }));

    const { buffer, fileType } = await generateExcelBufferAndType(excelData);

    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "TDS list Excel exported successfully",
      data: { buffer, fileType },
      excelData
    });
  } catch (error) {
    console.log("error", error);
  }
});

exports.getTdsList = asyncHandler(async (req, res) => {
  try {
    const corporateUserID = req.user._id;
    const { month, year, regimeType } = req.query;
    const tdsDetails = await getTdsList({corporateUserID, month, year, regimeType});
    if (!tdsDetails) {
      return res.status(400).json({
        status: false,
        responseCode: "001",
        message: "Tds List Not Found",
        data: {},
      });
    }
    return res.status(200).json({
      status: true,
      responseCode: '000',
      message: 'Tds List fetch successfully ',
      tdsDetails
    });
  } catch (error) {
    console.log("error",error)
  }
})