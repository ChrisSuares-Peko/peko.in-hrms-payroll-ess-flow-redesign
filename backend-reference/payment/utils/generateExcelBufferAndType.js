const ExcelJS = require("exceljs");

async function generateExcelBufferAndType(data, type) {
  try {
    // Create a new workbook and add a worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Sheet 1");

    // Add header row
    const header = Object.keys(data[0]);
    worksheet.addRow(header);

    // Add data rows
    data.forEach((row) => {
      worksheet.addRow(Object.values(row));
    });

    // Auto-fit columns
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const columnLength = cell.value ? cell.value.toString().length : 10;
        if (columnLength > maxLength) {
          maxLength = columnLength;
        }
      });
      column.width = maxLength < 10 ? 10 : maxLength;
    });

    let buffer;
    let fileType;
    
    // Save the workbook to a buffer and set the file type
    if (type === "excel") {
      buffer = await workbook.xlsx.writeBuffer();
      fileType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    } else if (type === "csv") {
      buffer = await workbook.csv.writeBuffer();
      fileType = "text/csv";
    } else {
      throw new Error("Unsupported file type");
    }
    console.log(fileType);
    return { buffer, fileType };
  } catch (error) {
    console.error("Error generating Excel buffer and type:", error);
    throw error;
  }
}

module.exports = { generateExcelBufferAndType };
