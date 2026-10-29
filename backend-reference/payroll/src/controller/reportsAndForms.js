const path = require("path");
const fs = require("fs");
const ExcelJS = require('exceljs');
const asyncHandler = require("../middleware/async");
const { getSalaryTableData, saveForm24Data, getForm24QByCorporateUser } = require("../models/use-cases/reportsAndForms");
const { mapExcelFieldsToSchema } = require("../services/form24qUpload");
const { uploadFileToS3 } = require("../utils/commonUploadFile");



exports.getSalaryTableDataForReports = asyncHandler(async (req, res) => {
  try {
    const corporateUserId = req.user._id;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        status: false,
        responseCode: '001',
        message: 'Year and month are required',
      });
    }

    const result = await getSalaryTableData(corporateUserId, parseInt(year), parseInt(month));

    return res.status(200).json({
      status: true,
      responseCode: '000',
      message: 'Salary table data fetched successfully',
      data: result,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: false,
      responseCode: '500',
      message: 'Server error while fetching salary table data',
    });
  }
});



exports.getForm24QTemplate = asyncHandler(async (req, res) => {
  try {
    const formPath = path.join(__dirname, "../../public", "Form-24Q.xlsx");


    // Check if the file exists
    if (!fs.existsSync(formPath)) {
      return res.status(404).json({
        status: false,
        responseCode: "404",
        message: "Form 24Q template not found.",
      });
    }

    // Send the Excel file directly for download
    return res.download(formPath, "Form24Q.xlsx", (err) => {
      if (err) {
        console.error("Download error:", err);
        return res.status(500).json({
          status: false,
          responseCode: "500",
          message: "Failed to download Form 24Q.",
        });
      }
    });
  } catch (error) {
    console.error("Error in getForm24QTemplate:", error);
    return res.status(500).json({
      status: false,
      responseCode: "500",
      message: "Internal server error.",
    });
  }
});


exports.uploadForm24Q = asyncHandler(async (req, res) => {
  try {
    const { jsonData, quarter } = req.body;
    const corporateUser = req.user._id; // ✅ corrected destructuring
    const file = req.file;

    // Step 1: Upload file to S3
    const base64Data = file.buffer.toString('base64');
    const extension = path.extname(file.originalname).replace('.', '').toLowerCase(); // e.g. xlsx

    const s3Path = `form24q/${corporateUser}/${quarter}`;
    const s3Url = await uploadFileToS3(base64Data, s3Path, extension);

    const structuredData = mapExcelFieldsToSchema(jsonData);


    const saved = await saveForm24Data({
      corporateUser,

      quarter,
      formData: structuredData, // Note: schema expects named keys now, not array
      s3FileUrl: s3Url,
    });
    return res.status(201).json({
      status: true,
      message: "Form 24Q saved successfully",
      data: saved,
    });
  } catch (error) {
    console.error("Error in uploadForm24Q:", error);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error while uploading Form 24Q.",
      data: {}
    });
  }

});




exports.getForm24QTemplate = asyncHandler(async (req, res) => {
  try {
    // Path to the existing template Excel file
    const templatePath = path.join(__dirname, "../../public", "FORM 24Q.xlsx");


    // Check if the file exists
    if (!fs.existsSync(templatePath)) {
      return res.status(404).json({
        status: false,
        responseCode: "404",
        message: "Form 24Q template not found.",
        data: null
      });
    }

    // Load the workbook
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    // Generate a random file name based on the current timestamp
    const randomFileName = `excel_${new Date().valueOf()}.xlsx`;

    // Write the workbook to a buffer
    const buffer = await workbook.xlsx.writeBuffer();

    console.log("Excel buffer generated successfully.");

    // Send the response with the buffer and file name
    return res.status(200).json({
      status: true,
      responseCode: "000",
      message: "Excel buffer sent successfully.",
      data: {
        buffer: buffer.toString('base64'),  // Convert buffer to base64
        fileName: randomFileName           // Return the random file name
      },
    });

  } catch (error) {
    console.error("Error generating template:", error);
    return res.status(500).json({
      status: false,
      responseCode: "500",
      message: "Internal server error while generating template.",
      data: null
    });
  }
});

exports.getForm24QUnderACorporateUser = asyncHandler(async (req, res) => {
  const corporateUserId = req.user._id;
  const { year, search } = req.query; // optional filters: ?year=2024&search=Q1

  if (!corporateUserId) {
    return res.status(400).json({
      status: false,
      message: 'Corporate user ID is required',
    });
  }

  const forms = await getForm24QByCorporateUser(corporateUserId, year, search);

  return res.status(200).json({
    status: true,
    message: 'Form 24Q data fetched successfully',
    data: forms,
  });
});