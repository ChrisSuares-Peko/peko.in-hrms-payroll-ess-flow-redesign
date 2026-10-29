const ExcelJS = require('exceljs');

async function generateExcelBufferAndType(data) {
  try {
      // Create a new workbook and add a worksheet
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Sheet 1');

      // Add header row
      const header = Object.keys(data[0]);
      worksheet.addRow(header);

      // Add data rows
      data.forEach(row => {
          worksheet.addRow(Object.values(row));
      });

      // Save the workbook to a buffer
      const buffer = await workbook.xlsx.writeBuffer();

      // Define the file type
      const fileType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      return { buffer, fileType };
  } catch (error) {
      console.error('Error generating Excel buffer and type:', error);
      throw error;
  }
}

module.exports = { generateExcelBufferAndType };