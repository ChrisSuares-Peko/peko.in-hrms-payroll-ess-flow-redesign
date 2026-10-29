const asyncHandler = require('../../middlewares/async');
const { findAllDomainHostingRefunds, domainHostingRefundsExcelCSVData } = require('../../models/use-cases/domainHostingRefunds');
const ErrorResponse = require('../../utils/error-response');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const puppeteer = require('puppeteer');
const fs = require('fs');

exports.findAllDomainHostingRefundsAndCount = asyncHandler(async (req, res, next) => {
    let { from, to, searchText, page, itemsPerPage } = req.query;
    const registeredBy = req.user.registeredBy;
    const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';

    page = page ? parseInt(page) : 1;
    itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
    const limit = itemsPerPage || undefined;
    const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : 0;

    const params = { from, to, searchText, sort, limit, offset, registeredBy };

    const data = await findAllDomainHostingRefunds(params);
    if (!data) {
        return next(new ErrorResponse('Something went wrong while fetching domain & hosting refunds', 500));
    }

    return res.status(200).json({
        status: true,
        data: {
            recordsTotal: data.count,
            data: data.rows,
        },
        message: 'Domain & hosting refunds fetched successfully',
        responseCode: '000',
    });
});

exports.domainHostingRefundsGenerateExcelCSV = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    const registeredBy = req.user.registeredBy;
    const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    const { type } = req.params;

    const params = { from, to, searchText, sort, registeredBy };

    const data = await domainHostingRefundsExcelCSVData(params);
    if (!data) {
        return next(new ErrorResponse('Something went wrong while generating report', 500));
    }
    if (data.length < 1) {
        return next(new ErrorResponse('No data available for export', 500));
    }

    const { buffer, fileType } = await generateExcelBufferAndType(data, type);
    return res.status(200).json({
        status: true,
        data: { buffer, fileType },
        message: 'Fetched excel/csv data successfully',
        responseCode: '000',
    });
});

exports.domainHostingRefundsGeneratePDF = asyncHandler(async (req, res, next) => {
    let { from, to, searchText } = req.query;
    const registeredBy = req.user.registeredBy;
    const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';

    const params = { from, to, searchText, sort, registeredBy };

    const data = await domainHostingRefundsExcelCSVData(params);
    if (!data) {
        return next(new ErrorResponse('Something went wrong while generating PDF', 500));
    }
    if (data.length < 1) {
        return next(new ErrorResponse('No data available for export', 500));
    }

    const templateDetails = { title: 'Domain & Hosting Refunds Report' };
    const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
    const random = new Date().valueOf();

    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

    const outputFile = `report-${random}.pdf`;
    await page.pdf({ scale: 0.8, path: outputFile, format: 'A4', preferCSSPageSize: true });

    const buffer = fs.readFileSync(outputFile);
    browser.close();
    fs.unlinkSync(outputFile);

    return res.status(200).json({
        status: true,
        message: 'Report generated successfully.',
        data: { buffer, fileType: 'application/pdf' },
        responseCode: '000',
    });
});
