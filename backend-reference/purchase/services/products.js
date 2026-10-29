const ExcelJS = require('exceljs');
const path = require('path');
const { fetchAllCategories, createBulkProducts } = require("../models/use-cases/products");
const { fetchVendorDetails } = require("../models/use-cases/vendors");
/* eslint-disable no-useless-catch */
exports.fetchProductsBulkUploadTemplate = async (req) => {
    try {
        const categories = [];
        const vendors = []
        const discountType = ['PERCENTAGE', 'FLAT']
        const vatType = ['PERCENTAGE', 'CUSTOM']

        //#1 fetch all categories
        const categoryData = await fetchAllCategories({});
        if (categoryData && Array.isArray(categoryData)) {
            for (let i = 0; i < categoryData.length; i++) { // Corrected loop syntax
                if (categoryData[i].categoryName && categoryData[i].categoryName !== '') {
                    categories.push(categoryData[i].categoryName);
                }
            }
        }
        //#2 fetch all vendors
        const type = "ECOMMERCE";
        let vendorsDetails = await fetchVendorDetails('', type)
        if (vendorsDetails && Array.isArray(vendorsDetails)) {
            for (let j = 0; j < vendorsDetails.length; j++) {
                if (vendorsDetails[j].vendorName && vendorsDetails[j].vendorName !== '') {
                    vendors.push(vendorsDetails[j].vendorName)
                }
            }
        }

        const existingFilePath = path.join(__dirname, '../public/ProductsBulkTemplate.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(existingFilePath);


        // Get the second sheet of the workbook
        const worksheet = workbook.getWorksheet(1); // Assuming the second sheet needs modification

        // Iterate over each cell in column  (starting from row 3) and apply data validation
        for (let rowNum = 3; rowNum <= 10000; rowNum++) {
            const cellC = worksheet.getCell(`C${rowNum}`);
            cellC.dataValidation = {
                type: 'list',
                formulae: [`"${categories.join(',')}"`],
                allowBlank: true
            };

            const cellJ = worksheet.getCell(`J${rowNum}`);
            cellJ.dataValidation = {
                type: 'list',
                formulae: [`"${discountType.join(',')}"`],
                allowBlank: true
            };

            const cellL = worksheet.getCell(`L${rowNum}`);
            cellL.dataValidation = {
                type: 'list',
                formulae: [`"${vatType.join(',')}"`],
                allowBlank: true
            };

            const cellN = worksheet.getCell(`N${rowNum}`);
            cellN.dataValidation = {
                type: 'list',
                formulae: [`"${vendors.join(',')}"`],
                allowBlank: true
            };

        }
        // Write the modified Excel file
        await workbook.xlsx.writeFile(existingFilePath);
        const productsTemplateUrl = `${req.protocol}://${req.get('host')}/ProductsBulkTemplate.xlsx?id=${new Date().valueOf()}`;//dummy id to avoid caching from browser side

        return productsTemplateUrl;
    } catch (error) {
        throw error;
    }
}

exports.bulkCreateProducts = async (productsJsonData) => {
    try {
        const results = await Promise.all(productsJsonData.map(async (obj) => {

            return await createBulkProducts(obj)

        }))
        return results;
    } catch (error) {
        throw error;
    }
}