const ExcelJS = require("exceljs");

exports.dataConversion = async (data, fileNamePrefix,subscriptionData=[]) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet1 = workbook.addWorksheet("Transaction Report");
    
    if (data.length>0) {
      // Define the header row
      const headerRow = Object.keys(data[0]);
      worksheet1.addRow(headerRow);

      // Add data rows to the worksheet
      data.forEach((rowData) => {
        worksheet1.addRow(Object.values(rowData));
      });
    }
    if (subscriptionData.length>0){
      const worksheet2 = workbook.addWorksheet("Subsciption Transaction Report");
      const headerRowSubsTrans = Object.keys(subscriptionData[0]);
      worksheet2.addRow(headerRowSubsTrans);

      // Add data rows to the worksheet1
      subscriptionData.forEach((rowData) => {
        worksheet2.addRow(Object.values(rowData));
      }); 
    }
      // Generate a unique filename for the Excel file
      const fileName = `${fileNamePrefix}.xlsx`;

      const filePath = `./public/excelReports/${fileName}`; // Specify the desired directory
      await workbook.xlsx.writeFile(filePath);

      // Log the path to the console
      console.log(`Transaction report saved at: ${filePath}`);

      // Optionally, you can return the file path for further use
      return { fileName: fileName, filePath: filePath };
    
  } catch (error) {
    console.error(error);
  }
};
