const asyncHandler = require('express-async-handler');
const XLSX = require('xlsx');

exports.validateExcelHeaders = asyncHandler((req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ status: false, message: "No file uploaded" });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Get headers
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0];

    // Expected headers
    const expectedHeaders = ["Category Name", "Subcategory Name"];

    const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
        return res.status(400).json({
            status: false,
            message: `Invalid template! Missing columns: ${missingHeaders.join(", ")}`
        });
    }

    
    req.workbook = workbook;
    next();
});


exports.excelToJson = asyncHandler((req, res, next) => {
    const sheetName = req.workbook.SheetNames[0];
    const worksheet = req.workbook.Sheets[sheetName];

    const data = XLSX.utils.sheet_to_json(worksheet); // converts rows to JSON
    req.excelData = data;
    next();
});