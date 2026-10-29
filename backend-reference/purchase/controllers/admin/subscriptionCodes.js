const crypto = require('crypto');
const asyncHandler = require("../../middlewares/async");
const { findOne, createSubscriptionCode, findAllSubscriptionCodes, updateSubscriptionCode, deleteSubscriptionCode, subscriptionCodeExport } = require("../../models/use-cases/subscriptionVoucher");
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const puppeteer = require("puppeteer");
const fs = require("fs");

const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const codeLength = 16;

function generateRandomCode() {
    let code = '';
    for (let i = 0; i < codeLength; i++) {
        const randomIndex = crypto.randomInt(0, characters.length);
        code += characters[randomIndex];
    }
    return code;
}

async function generateUniqueActivationCode(quantity) {
    const codes = new Set();
    while (codes.size < quantity) {
        const code = generateRandomCode(); // Generate a 16-character alphanumeric code
        // Check if the code already exists in the database
        const existingCode = await findOne({ whereClause: { activationCode: code } });
        if (!existingCode) {
            codes.add(code);
        }
    }
    return Array.from(codes);
}

exports.createNewActivationCode = asyncHandler(async (req, res, next) => {

    const { quantity = 1, ...data } = req.body;

    try {
        // const activationCode = Math.floor(1000000000000000 + Math.random() * 9000000000000000)
        const activationCodes = await generateUniqueActivationCode(quantity)

        const subscriptionCodesData = activationCodes.map(code => ({
            ...data,
            activationCode: code,
        }));

        const subscriptionCode = await createSubscriptionCode(subscriptionCodesData)

        if (!subscriptionCode) {
            return next(new ErrorResponse(`Something went wrong while creating activation code`, 500))
        } else {
            return res.status(200).json({
                status: true,
                message: "Activation code created successfully",
                responseCode: "000",
                data: { subscriptionCode },
            })
        }
    } catch (error) {
        console.log(error);
        return next(new ErrorResponse(`Something went wrong while creating activation code`, 500))
    }
})

exports.findAllSubscriptionCodesAndCount = asyncHandler(async (req, res, next) => {
    let { searchText, page, itemsPerPage } = req.query;

    try {
        const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";
        let sortField = req.query.sortField || 'createdAt'

        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : 10;
        let limit = itemsPerPage;

        let offset;
        if (page && itemsPerPage) {
            offset = (page - 1) * itemsPerPage;
        }

        let params = {
            limit,
            offset,
            searchText,
            sort,
            sortField,
        };
        const subscriptionCodes = await findAllSubscriptionCodes(params);
        if (!subscriptionCodes) {
            return next(new ErrorResponse(`Something went wrong`, 500));
        } else {
            return res.status(200).json({
                status: true,
                data: { ...subscriptionCodes },
                message: "Subscription codes fetched successfully",
                responseCode: "000",
            });
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { error })
        return next(new ErrorResponse(`Something went wrong`, 500));
    }
});

exports.updateActivationCode = asyncHandler(async (req, res, next) => {

    const data = req.body
    try {
        const isAlreadyUsed = await findOne({ whereClause: { id: req.params.id, isUsed: true } });

        if (isAlreadyUsed) {
            return res.status(400).json({
                status: false,
                message: "Unable to update. Activation code is already used.",
                responseCode: "001",
                data: {},
            })
        }

        const isUpdated = await updateSubscriptionCode(data, { id: req.params.id })

        if (!isUpdated) {
            return next(new ErrorResponse(`Something went wrong while updating activation code`, 500))
        } else {
            return res.status(200).json({
                status: true,
                message: "Subscription activation code updated successfully",
                responseCode: "000",
                data: {},
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { error })

        return next(new ErrorResponse(`Something went wrong while updating activation code`, 500))
    }
})

exports.updateStatusActivationCode = asyncHandler(async (req, res, next) => {

    const data = req.body
    try {
        const isUpdated = await updateSubscriptionCode(data, { id: req.params.id })

        if (!isUpdated) {
            return next(new ErrorResponse(`Something went wrong while updating activation code`, 500))
        } else {
            return res.status(200).json({
                status: true,
                message: "Subscription activation code updated successfully",
                responseCode: "000",
                data: {},
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { error })

        return next(new ErrorResponse(`Something went wrong while updating activation code`, 500))
    }
})

exports.deleteActivationCode = asyncHandler(async (req, res, next) => {
    try {

        const isAlreadyUsed = await findOne({ whereClause: { id: req.params.id, isUsed: true } });

        if (isAlreadyUsed) {
            return res.status(400).json({
                status: false,
                message: "Unable to delete. Activation code is already used.",
                responseCode: "001",
                data: {},
            })
        }
        const isDeleted = await deleteSubscriptionCode({ id: req.params.id })

        if (!isDeleted) {
            return next(new ErrorResponse(`Something went wrong while deleting activation code`, 500))
        } else {
            return res.status(200).json({
                status: true,
                message: "Subscription activation code deleted successfully",
                responseCode: "000",
                data: {},
            })
        }
    } catch (error) {
        customLog(req?.LogTraceId, "error", { error })

        return next(new ErrorResponse(`Something went wrong while deleting activation code`, 500))
    }
})

exports.subscriptionCodeExcelCSV = asyncHandler(async (req, res, next) => {
    let { searchText,type} = req.query;
    let params = {
        searchText,
    };
    const data = await subscriptionCodeExport(params);
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

exports.subscriptionCodePDF = asyncHandler(async (req, res, next) => {
    let { searchText } = req.query;
    let params = {       
        searchText,        
    };
    const data = await subscriptionCodeExport(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 400));
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 400));
    }

    const templateDetails = {
        title: 'Subscription Code'
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