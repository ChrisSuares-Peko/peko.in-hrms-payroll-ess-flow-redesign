const ErrorResponse = require('../utils/error-response');
const exceljs = require('exceljs');

exports.excelToJsonGiftCards = async(req, res, next) => {
    if (!req.files || !req.files.giftCards) {
        return next(new ErrorResponse(`No file uploaded`, 200));
    }

    const excelFile = req.files.giftCards;

    try {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.load(excelFile.data)

        const worksheet = workbook.worksheets[0];

        const headerRow = worksheet.getRow(1).values;

        const validateKeys = checkHeaderValues(headerRow);

        if (!validateKeys.status) {
            return next(new ErrorResponse(validateKeys.error, 200));
        }

        // Convert the sheet to JSON
        const jsonData = [];
        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex !== 1) { // Skip the header row
                const rowData = {};
                row.eachCell((cell, colIndex) => {
                    rowData[headerRow[colIndex]] = cell.value;
                });
                jsonData.push(rowData);
            }
        });

        // Store the converted JSON data in the request object
        req.excelToJsonData = jsonData;

        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        console.error(error);
        return next(new ErrorResponse(`Something went wrong while processing the Excel data`, 200));
    }
}

function checkHeaderValues(headerRow) {
    const expectedValues = ['serviceOperatorId', 'product_id', 'brand_code', 'name', 'image', 'priceType', 'minDenomination', 'maxDenomination', 'denominations', 'activation_fee', 'currency', 'description', 'redemption_instructions'];
    const headerValues = Object.values(headerRow);
    const missingValues = expectedValues.filter(value => !headerValues.includes(value));
    const extraValues = headerValues.filter(value => !expectedValues.includes(value));
    if (missingValues.length > 0 || extraValues.length > 0) {
        const errorMessages = [];
        if (missingValues.length > 0) {
            errorMessages.push(`Missing headings: ${missingValues.join(', ')}`);
        }
        if (extraValues.length > 0) {
            errorMessages.push(`Extra headings: ${extraValues.join(', ')}`);
        }
        return {
            status: false,
            error: errorMessages.join('; ')
        };
    }
    return { status: true };
}

exports.excelToJsonProducts = async(req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse(`No file uploaded`, 200));
    }
    const excelFile = req.file;

    try {
         // Load the Excel file
         const workbook = new exceljs.Workbook();
         await workbook.xlsx.load(excelFile.buffer);
 
         // Get the second sheet (index 1)
         const worksheet = workbook.worksheets[1];
 
         // Convert the sheet to JSON
         const jsonData = [];
         worksheet.eachRow((row,index) => {
             const rowData = {};
             row.eachCell((cell, colIndex) => {
                 rowData[String.fromCharCode(64 + colIndex)] = cell.value; // Convert column index to letter
             });
             if(index ===2){
                 return false;
             }
             jsonData.push(rowData);
         });
 
         if (!jsonData || jsonData.length === 0) {
             return next(new ErrorResponse(`No data found in the Excel file`, 200));
         }
        // Map the JSON data to the desired format
        const finalResult = jsonData.map((row,i) => ({
            TID:i,
            name: row.A,
            brand: row.B,
            categoryName: row?.C,
            description: row.D,
            highlights: row.E,
            warranty: row.F,
            SKUCode: row.G,
            actualPrice: row.H,
        //  price: row.I,
            quantity: row.I,
            discountType: row.J,
            discount: row.K,
            gstType: row.L,
            GST: row.M,  
            vendorName: row?.N,
            vendorPrice: row.O,
            productImage1: row.P,
            productImage2: row.Q,
            productImage3: row.R,
        }));

        // Store the converted JSON data in the request object
        req.body.productsJsonData = finalResult;

        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        console.error(error);
        return next(new ErrorResponse(`Something went wrong while processing the Excel data`, 200));
    }
}

exports.excelToJsonSoftwaresPlans = async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse(`No file uploaded`, 400));
    }
    const excelFile = req.file;

    try {
        // Load the Excel file
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.load(excelFile.buffer);

        // Get the second sheet (index 1)
        const worksheet = workbook.worksheets[1];

        // Convert the sheet to JSON
        const jsonData = [];
        worksheet.eachRow((row,index) => {
            const rowData = {};
            row.eachCell((cell, colIndex) => {
                rowData[String.fromCharCode(64 + colIndex)] = cell.value; // Convert column index to letter
            });
            if(index ===2){
                return false;
            }
            jsonData.push(rowData);
        });

        if (!jsonData || jsonData.length === 0) {
            return next(new ErrorResponse(`No data found in the Excel file`, 200));
        }

        // Map the JSON data to the desired format
        const finalResult = jsonData.map((row,i) => ({
            TID:i,
            planId: row.A,
            name: row.B,
            validity: row.C,
            discount: row.D,
            vendorPrice: row.E,
            price: row.F,
            noOfUsers: row.G,
            features: row.H,
            software: row.I
        }));


        // Store the converted JSON data in the request object
        req.body.softwaresJsonData = finalResult;
        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        console.error(error);
        return next(new ErrorResponse(`Something went wrong while processing the Excel data`, 500));
    }
}

exports.excelToJsonSoftwares = async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse(`No file uploaded`, 400));
    }
    const excelFile = req.file;

    try {
        // Load the Excel file
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.load(excelFile.buffer);

        // Get the second sheet (index 1)
        const worksheet = workbook.worksheets[1];

        // Convert the sheet to JSON
        const jsonData = [];
        worksheet.eachRow((row,index) => {
            const rowData = {};
            row.eachCell((cell, colIndex) => {
                if(typeof cell.value=="object"){
                    // hyper link handle
                    rowData[String.fromCharCode(64 + colIndex)] = cell.value?.text; // Convert column index to letter
                }else{
                    rowData[String.fromCharCode(64 + colIndex)] = cell.value; // Convert column index to letter
                }
            });
            if(index ===2){
                return false;
            }
            jsonData.push(rowData);
        });

        if (!jsonData || jsonData.length === 0) {
            return next(new ErrorResponse(`No data found in the Excel file`, 200));
        }


        // Map the JSON data to the desired format
        const finalResult = jsonData.map((row,i) => ({
            TID:i,
            productId: `${row.A}`,
            name: row.B,
            description: row.C,
            discount: row.D && `${row.D}`,
            features: row.E,
            pekoEmail: row.F && splitEmails(row.F), // multiple emails handle
            sendMail: toBoolean(row.G),
            typeOfOrder: row.H,
            image: row.I,
            vendor: row.J,
            category: row.K
        }));

        // Store the converted JSON data in the request object
        req.body.softwaresJsonData = finalResult;

        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        console.error(error);
        return next(new ErrorResponse(`Something went wrong while processing the Excel data`, 500));
    }
}

exports.excelToJsonPlans = async (req, res, next) => {
    if (!req.file) {
        return next(new ErrorResponse(`No file uploaded`, 400));
    }
    const excelFile = req.file;
    try {
        const workbook = new exceljs.Workbook();
        await workbook.xlsx.load(excelFile.buffer);
        const worksheet = workbook.worksheets[0];
        const headerRow = worksheet.getRow(1).values;
        const jsonData = [];

        worksheet.eachRow((row, rowIndex) => {
            if (rowIndex !== 1) { // Skip the header row
                const rowData = {};
                row.eachCell((cell, colIndex) => {
                    rowData[headerRow[colIndex]] = cell.value;
                });

                // For each country row, create multiple entries for each data plan
                const countryData = {
                    country: rowData["Country"],
                    coverageId: rowData["CoverageId"],
                    provider: rowData["Provider"],
                    networks: rowData["Networks"]
                };

                Object.keys(rowData).forEach(key => {
                    if (key.match(/^\d+_GB_\d+_d$/)) { // Match keys like '1_GB_7_d'
                        const [dataGB, periodDays] = key.split("_GB_").map(k => parseInt(k));
                        const amount = rowData[key].result;
                        if (amount > 0){
                            const dataPlan = {
                                ...countryData,
                                name: `${countryData.country}_${key}`,
                                dataMBs: dataGB * 1024, // Convert GB to MB
                                periodDays: periodDays, // Days from the key
                                amount: rowData[key].result, // The amount from the cell value
                                status:1
                            };
                            jsonData.push(dataPlan);
                        }                        
                    }
                });
            }
        });
        req.body.plansJsonData = jsonData;
        // Continue to the next middleware or route handler
        next();
    } catch (error) {
        console.error(error);
        return next(new ErrorResponse(`Something went wrong while processing the Excel data`, 200));
    }
}

function toBoolean(value) {
     if (value === 'false') return false
     return Boolean(value)
}

function splitEmails(input) {
    // Use a regular expression to split on both ', ' and ','
    return input.split(/,\s*/);
}