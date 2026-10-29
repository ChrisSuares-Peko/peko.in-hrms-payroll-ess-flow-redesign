const ExcelJS = require('exceljs');
const path = require('path');
const { fetchSoftwaresList } = require('../models/use-cases/subscription_plans');
const { createBulkSoftwarePlans } = require('../models/use-cases/software_plan');
const fs = require('fs');
const { uploadExcelDocument } = require('../utils/commonUploadFile');
/* eslint-disable no-useless-catch */
exports.fetchPlansBulkUploadTemplate = async () => {
    try {
        const softwares = []

        //#1 fetch all softwares
        let softwareDetails = await fetchSoftwaresList("")
        if (softwareDetails && Array.isArray(softwareDetails)) {
            for (let j = 0; j < softwareDetails.length; j++) {
                if (softwareDetails[j].name && softwareDetails[j].name !== '') {
                    softwares.push(softwareDetails[j].name)
                }
            }
        }
        console.log("🚀 ~ exports.fetchPlansBulkUploadTemplate= ~ softwareDetails:", softwares)
        
        const existingFilePath = path.join(__dirname, '../public/PlansBulkTemplate.xlsx');
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(existingFilePath);

        // Get the second sheet of the workbook
        const worksheet = workbook.getWorksheet(2); // Assuming the second sheet needs modification

        // Iterate over each cell in column  (starting from row 3) and apply data validation
        for (let rowNum = 3; rowNum <= 10000; rowNum++) {
            const cellI = worksheet.getCell(`I${rowNum}`);
            cellI.dataValidation = {
                type: 'list',
                formulae: [`"${softwares.join(',')}"`],
                allowBlank: true
            };
        }
        // Write the modified Excel file
        await workbook.xlsx.writeFile(existingFilePath);
         const base64Data = fs.readFileSync(existingFilePath, { encoding: 'base64' })

         //firebase upload
         const fileFormat = 'xlsx'
         const planTemplateUrl = await uploadExcelDocument(base64Data, 'PlansBulkTemplate', fileFormat)
        // const planTemplateUrl = `${req.protocol}://${req.get('host')}/PlansBulkTemplate.xlsx?id=${new Date().valueOf()}`; //dummy id to avoid caching from browser side

        return planTemplateUrl;
    } catch (error) {
        throw error;
    }
}

exports.bulkCreateSoftwarePlans = async (plansJsonData) => {
    try {
        const results = await Promise.all(plansJsonData.map(async (obj) => {
            return await createBulkSoftwarePlans(obj)
        }))
        return results;
    } catch (error) {
        throw error;
    }
}