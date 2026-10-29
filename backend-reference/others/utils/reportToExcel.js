const ExcelJS = require("exceljs");
const os = require("os");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

// F-OTH-29: prefix a leading = + - @ with a single quote so Excel/Sheets treats the cell as
// literal text instead of a formula — otherwise a field containing something like
// =HYPERLINK(...) executes when the exported file is opened.
const sanitizeForExcel = (value) => {
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
    return `'${value}`
  }
  return value
}

exports.dataConversion = async (data, type) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Transaction Report");
    
    if (data.length>0) {
      // Define the header row
      const headerRow = Object.keys(data[0]);
      worksheet.addRow(headerRow);

      // Add data rows to the worksheet
      data.forEach((rowData) => {
        worksheet.addRow(Object.values(rowData).map(sanitizeForExcel));
      });

      // F-OTH-22: write to the OS temp dir (not public/) under a unique name, so the
      // report is never reachable via the static file server between generation and
      // the caller's cleanup — it only ever needs to exist long enough to be emailed.
      const fileName = `${type}_Transaction_Report_${uuidv4()}.xlsx`;
      const filePath = path.join(os.tmpdir(), fileName);
      await workbook.xlsx.writeFile(filePath);

      // Log the path to the console
      console.log(`Transaction report saved at: ${filePath}`);

      // Optionally, you can return the file path for further use
      return { fileName: fileName, filePath: filePath };
    }
  } catch (error) {
    console.error(error);
  }
};
