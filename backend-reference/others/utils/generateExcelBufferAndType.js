const ExcelJS = require('exceljs')

// F-OTH-29: prefix a leading = + - @ with a single quote so Excel/Sheets treats the cell as
// literal text instead of a formula — otherwise a field like remarks or name containing
// something like =HYPERLINK(...) executes when the exported file is opened.
const sanitizeForExcel = (value) => {
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
    return `'${value}`
  }
  return value
}

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
         worksheet.addRow(Object.values(row).map(sanitizeForExcel));
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
   async function generateMultipleExcelBufferAndType(data1,data2,type) {
    try {
      // Create a new workbook and add a worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet1 = workbook.addWorksheet("Sheet 1");
      const worksheet2 = workbook.addWorksheet("Sheet 2");
  
      // Add header row
      const header1 = Object.keys(data1[0]);
      const header2 = Object.keys(data2[0]);
      worksheet1.addRow(header1);
      worksheet2.addRow(header2);
  
      // Add data rows
      data1.forEach((row) => {
        worksheet1.addRow(Object.values(row).map(sanitizeForExcel));
      });
  
      data2.forEach((row) => {
        worksheet2.addRow(Object.values(row).map(sanitizeForExcel));
      });
      // Auto-fit columns
      worksheet1.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength;
      });
      worksheet2.columns.forEach((column) => {
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
  
  module.exports = { generateExcelBufferAndType,generateMultipleExcelBufferAndType };
