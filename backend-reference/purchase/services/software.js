const ExcelJS = require("exceljs");
const path = require("path");
const fs = require('fs')
const { fetchVendorDetails } = require("../models/use-cases/vendors");
const { createBulkSoftwares } = require("../models/use-cases/softwares");
const { fetchAllCategories } = require("../models/use-cases/products");
const { uploadFile } = require("../utils/commonUploadFile");
/* eslint-disable no-useless-catch */
exports.fetchSoftwaresBulkUploadTemplate = async () => {
  try {
    const vendors = [];
    const categories = [];
    const typeOfOrder = ["API", "MANUAL"];
    const boolean = [true, false];
    const type = "SOFTWARE";

    //#1 fetch all vendors
    let vendorsDetails = await fetchVendorDetails("", type);
    if (vendorsDetails && Array.isArray(vendorsDetails)) {
      for (let j = 0; j < vendorsDetails.length; j++) {
        if (vendorsDetails[j].vendorName && vendorsDetails[j].vendorName !== "") {
          vendors.push(vendorsDetails[j].vendorName);
        }
      }
    }

    const categoryData = await fetchAllCategories({});
    if (categoryData && Array.isArray(categoryData)) {
      for (let i = 0; i < categoryData.length; i++) {
        if (categoryData[i].categoryName && categoryData[i].categoryName !== "") {
          categories.push(categoryData[i].categoryName);
        }
      }
    }


    const existingFilePath = path.join(__dirname, "../public/SoftwaresBulkTemplate.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(existingFilePath);

    // Get the second sheet of the workbook
    const worksheet = workbook.getWorksheet(1); // Assuming the second sheet needs modification

    // Iterate over each cell in column  (starting from row 3) and apply data validation
    for (let rowNum = 3; rowNum <= 10000; rowNum++) {
      const cellF = worksheet.getCell(`G${rowNum}`);
      cellF.dataValidation = {
        type: "list",
        formulae: [`"${boolean.join(",")}"`],
        allowBlank: true,
      };
      const cellH = worksheet.getCell(`H${rowNum}`);
      cellH.dataValidation = {
        type: "list",
        formulae: [`"${typeOfOrder.join(",")}"`],
        allowBlank: true,
      };
      const cellJ = worksheet.getCell(`J${rowNum}`);
      cellJ.dataValidation = {
        type: "list",
        formulae: [`"${vendors.join(",")}"`],
        allowBlank: true,
      };
      const cellK = worksheet.getCell(`K${rowNum}`);
      cellK.dataValidation = {
        type: "list",
        formulae: [`"${categories.join(",")}"`],
        allowBlank: true,
      };
    }
    // Write the modified Excel file
    await workbook.xlsx.writeFile(existingFilePath);
     const base64Data = fs.readFileSync(existingFilePath, { encoding: 'base64' })

     //firebase upload
     const fileFormat = 'xlsx'
     const filePath = `common/SoftwaresBulkTemplate`
     const uploadedFileUrl = await uploadFile(base64Data, filePath, fileFormat)

    // const softwareTemplateUrl = `${req.protocol}://${req.get("host")}/SoftwaresBulkTemplate.xlsx?id=${new Date().valueOf()}`; //dummy id to avoid caching from browser side

    return uploadedFileUrl
  } catch (error) {
    throw error;
  }
};

exports.bulkCreateSoftwares = async (softwaresJsonData) => {
  try {
    const results = await Promise.all(
      softwaresJsonData.map(async (obj) => {
        return await createBulkSoftwares(obj);
      })
    );
    return results;
  } catch (error) {
    throw error;
  }
};
