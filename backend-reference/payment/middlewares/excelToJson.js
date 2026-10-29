const ErrorResponse = require('../utils/error-response');
const exceljs = require('exceljs');

exports.excelToJsonBillers = async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse(`No file uploaded`, 400));
  }
  const excelFile = req.file;

  try {
    // Load the Excel file
    const workbook = new exceljs.Workbook();
    await workbook.xlsx.load(excelFile.buffer);

    // Get the first sheet
    const worksheet = workbook.worksheets[0];

    // Get header row to identify column positions
    const headerRow = worksheet.getRow(1);
    const headers = [];
    headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
      headers[colNumber] = cell.value ? String(cell.value).trim().toLowerCase() : '';
    });

    // Find column indices (case-insensitive matching)
    const findColumnIndex = (searchTerms) => {
      for (let i = 1; i < headers.length; i++) {
        const header = headers[i];
        if (header && searchTerms.some(term => header.includes(term.toLowerCase()))) {
          return i;
        }
      }
      return null;
    };

    const blrIdCol = findColumnIndex(['blr_id', 'billerid', 'biller_id', 'biller id']) || 1;
    const blrNameCol = findColumnIndex(['blr_name', 'billername', 'biller_name', 'biller name', 'name']);
    const blrCategoryNameCol = findColumnIndex(['blr_category_name', 'categoryname', 'category_name', 'category name', 'category']);
    const blrCoverageCol = findColumnIndex(['blr_coverage', 'coverage', 'biller_coverage']);

    // Convert the sheet to JSON - extract all biller details from Excel
    const jsonData = [];
    worksheet.eachRow((row, rowIndex) => {
      if (rowIndex === 1) {
        // Skip header row
        return;
      }
      
      // Get biller ID from first column (required)
      const billerIdCell = row.getCell(blrIdCol);
      const billerId = billerIdCell ? billerIdCell.value : null;
      
      if (billerId && String(billerId).trim() !== '') {
        const billerData = {
          billerId: String(billerId).trim()
        };

        if (blrNameCol) {
          const nameCell = row.getCell(blrNameCol);
          if (nameCell && nameCell.value) {
            billerData.blr_name = String(nameCell.value).trim();
          }
        }

        if (blrCategoryNameCol) {
          const categoryCell = row.getCell(blrCategoryNameCol);
          if (categoryCell && categoryCell.value) {
            billerData.blr_category_name = String(categoryCell.value).trim();
          }
        }

        if (blrCoverageCol) {
          const coverageCell = row.getCell(blrCoverageCol);
          if (coverageCell && coverageCell.value) {
            billerData.blr_coverage = String(coverageCell.value).trim();
          }
        }

        jsonData.push(billerData);
      }
    });

    if (!jsonData || jsonData.length === 0) {
      return next(new ErrorResponse(`No biller IDs found in the Excel file`, 400));
    }

    // Store the converted JSON data in the request object
    req.body.billersJsonData = jsonData;

    next();
  } catch (error) {
    console.error("Error in excelToJsonBillers", error);
    return next(new ErrorResponse(`Something went wrong while processing the Excel data`, 500));
  }
}
