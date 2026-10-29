const ExcelJS = require("exceljs");
const path = require("path");
const fs = require('fs');
const { uploadExcelDocument } = require("../utils/commonUploadFile");

/* eslint-disable no-useless-catch */
exports.fetchEsimBulkUploadTemplate = async () => {
  try {
    const existingFilePath = path.join(__dirname, "../public/EsimPlansBulkTemplate.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(existingFilePath);
    // Get the second sheet of the workbook
   
    // Write the modified Excel file
    await workbook.xlsx.writeFile(existingFilePath);
    const base64Data = fs.readFileSync(existingFilePath, { encoding: 'base64' });

    //firebase upload
    const fileFormat = 'xlsx';
    const filePath=`ExcelTemplate`
    const uploadedFileUrl = await uploadExcelDocument(base64Data, filePath, fileFormat);

console.log("uploadedFileUrl",uploadedFileUrl)
    return uploadedFileUrl;
  } catch (error) {
    throw error;
  }
};

