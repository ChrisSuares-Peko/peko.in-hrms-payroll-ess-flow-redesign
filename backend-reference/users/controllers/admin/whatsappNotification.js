const { customLog } = require("../../utils/loggerHelper");
const asyncHandler = require("../../middlewares/async");
const { createOrUpdateWhatsAppNumberSetting, fetchWhatsAppNumbers, changeWhatsAppNumber, changeWhatsAppStatus, deleteWhatsAppNumber, isNameOrNumberExists, isDuplicateEntry, whatsAppNumberExport } = require("../../models/use-cases/whatsappNotification");
const puppeteer = require("puppeteer");
const fs = require("fs");
const ErrorResponse = require("../../utils/error-response");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");

// Controller function to handle the addition of WhatsApp numbers
exports.addOrUpdateWhatsAppNumber = asyncHandler(async (req, res) => {
    try {
        const { whatsappNumber, name: username } = req.body;
        const name = "whatsAppNotifications"

        const existingEntry = await isNameOrNumberExists(whatsappNumber, username);
        if(existingEntry) {
            return res.status(400).json({
                status: false,
                message: existingEntry.message,
                data: {},
                responseCode: '001',
            });
        }

        // Call the use case function to create or update the setting
        const result = await createOrUpdateWhatsAppNumberSetting({ 
            name, 
            whatsappNumber, 
            username 
        });

        if (!result) {
            return res.status(500).json({
                status: false,
                message: 'Failed to add or update WhatsApp numbers',
                data: {},
                responseCode: '001',
            });
        }

        return res.status(result.updated ? 200 : 201).json({
            status: true,
            message: result.updated
                ? 'WhatsApp numbers updated successfully'
                : 'WhatsApp numbers added successfully',
            data: result.setting,
            responseCode: '000',
        });

    } catch (error) {
        console.error('Error in addOrUpdateWhatsAppNumber controller:', error);
        return res.status(500).json({
            status: false,
            message: 'Unable to add or update WhatsApp numbers.',
            data: {},
            responseCode: '001',
        });
    }
});

exports.getWhatsAppNumbers = asyncHandler(async (req, res) => {
    try {
        const { searchText = '', page = 1, itemsPerPage = 10 } = req.query;

        const { numbers, totalCount } = await fetchWhatsAppNumbers(searchText, page, itemsPerPage);

        return res.status(200).json({
            status: true,
            message: 'WhatsApp numbers fetched successfully',
            data: {
                numbers,
                totalCount,
                currentPage: page,
                itemsPerPage
            },
            responseCode: '000'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Failed to fetch WhatsApp numbers',
            data: {},
            responseCode: '001'
        });
    }
});



exports.updateWhatsAppNumber = asyncHandler(async (req, res) => {
    try {
        const { currentNumber, data } = req.body;

        const existingEntry = await isDuplicateEntry(currentNumber, data);
        if(existingEntry) {
            return res.status(400).json({
                status: false,
                message: existingEntry.message,
                data: {},
                responseCode: '001',
            });
        }

        const result = await changeWhatsAppNumber(currentNumber, data);

        if (!result) {
            return res.status(404).json({
                status: false,
                message: 'WhatsApp number not found',
                data: {},
                responseCode: '001'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'WhatsApp number updated successfully',
            data: result,
            responseCode: '000'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: 'Failed to update WhatsApp number',
            data: {},
            responseCode: '001'
        });
    }
});

// Controller to update WhatsApp status
exports.updateWhatsAppStatus = asyncHandler(async (req, res) => {
    try {
        const { whatsappNumber, status } = req.body;

        const result = await changeWhatsAppStatus(whatsappNumber, status);

        if (!result) {
            return res.status(404).json({
                status: false,
                message: 'WhatsApp number not found',
                data: {},
                responseCode: '001'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'WhatsApp status updated successfully',
            data: result,
            responseCode: '000'
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            status: false,
            message: 'Failed to update WhatsApp status',
            data: {},
            responseCode: '001'
        });
    }
});

exports.removeWhatsAppNumber = asyncHandler(async (req, res) => {
    try {
        const { whatsappNumber } = req.params;
        const updatedDetails = await deleteWhatsAppNumber(whatsappNumber);

        if (!updatedDetails) {
            return res.status(404).json({
                status: false,
                message: 'WhatsApp number not found',
                data: {},
                responseCode: '001'
            });
        }

        return res.status(200).json({
            status: true,
            message: 'WhatsApp number deleted successfully',
            data: updatedDetails,
            responseCode: '000'
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            status: false,
            message: 'Failed to delete WhatsApp number',
            data: {},
            responseCode: '001'
        });
    }
});

exports.whatsAppNumberExcelCSV = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage } = req.query;
    const { type } = req.query;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    // Parse page and itemsPerPage to integers (you can also use parseInt)
    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    let limit = itemsPerPage

    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
        offset = (page - 1) * itemsPerPage;
    }
    const attributes = ['id', 'couponCode', 'discountType', 'discount', 'validFrom', 'validTo', 'status', 'createdAt'];
    let params = {
        limit,
        offset,
        searchText,
        sort,
        sortField,
        attributes
    }
    const data = await whatsAppNumberExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500));
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409));
    } else {
        const { buffer, fileType } = await generateExcelBufferAndType(data, type);
        console.log("buffer", buffer)
        console.log("fileType", fileType)
        return res.status(200).json({
            status: true,
            data: { buffer, fileType },
            message: "Fetched excel/csv datas successfully",
            responseCode: "000",
        });
    }
});

exports.whatsAppNumberPDF = asyncHandler(async (req, res, next) => {
   let { searchText } = req.query;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    let sortField = req.query.sortField || 'createdAt'

    const attributes = ['id', 'couponCode', 'discountType', 'discount', 'validFrom', 'validTo', 'status', 'createdAt'];
    let params = {
        searchText,
        sort,
        sortField,
        attributes
    }
    const data = await whatsAppNumberExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 400));
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 400));
    }

    const templateDetails = {
        title: 'Peko WhatsApp Numbers'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
    let random = new Date().valueOf();

    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: "domcontentloaded" });

    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
        scale: 0.6,
        path: outputFile,
        format: "A4",
        preferCSSPageSize: true,
    });

    customLog(
        req?.LogTraceId,
        "info",
        { message: "PDF generated successfully!" }
    );

    const buffer = fs.readFileSync(outputFile);

    browser.close();

    fs.unlinkSync(outputFile);

    return res.status(200).json({
        status: true,
        message: "report generated successfully.",
        data: {
            buffer,
            fileType: "application/pdf",
        },
        responseCode: "000",
    });
});
