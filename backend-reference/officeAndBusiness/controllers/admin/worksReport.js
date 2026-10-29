const asyncHandler = require("../../middlewares/async");
const { updateOrder } = require("../../models/use-cases/order");
const { findAllTransactions, worksExcelCSVData } = require("../../models/use-cases/works");
const ErrorResponse = require("../../utils/error-response");
const puppeteer = require('puppeteer');
 const fs = require("fs");
const { generateExcelBufferAndType } = require("../../utils/generateExcelBufferAndType");
const { reportPdfTemplate } = require("../../utils/reportTemplate");
// const { createSubscription } = require("../../models/use-cases/pekoWorksSubscription");
const accessKey = 'peko_works'

exports.findAllTransactionsAndCount = asyncHandler(async (req, res, next) => {   

    let { from, to, searchText, page, itemsPerPage, corporateId, partnerId } = req.query;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'transactionDate'

    // Parse page and itemsPerPage to integers (you can also use parseInt)
     page = page ? parseInt(page) : 1;
     itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
     let limit = itemsPerPage
    // Calculate offset based on page and itemsPerPage
    let offset;
    if (page && itemsPerPage) {
      offset = (page - 1) * itemsPerPage;
    }


    let serviceAttribute = []
    let credentialAttribute = ['name', 'username', 'registeredBy']
    let transactionAttribute = []
    let orderAttribute = ['id', 'amountInINR', 'orderResponse',"transactionDate", 'corporateTxnId', 'workspaceOrderStatus']

    let params = {
        from,
        to,
        accessKey,
        searchText,
        sort,
        limit,
        offset,
        serviceAttribute,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        corporateId,
        partnerId
    }

    const transactionsData = await findAllTransactions(params);
    if (!transactionsData) {
        return next(new ErrorResponse(`Something went wrong while getting all orders from DB`, 500))
    } else {
        return res.status(200).json({
            'status': true,
            'data': {
                result: transactionsData.rows,
                totalData: transactionsData.count
            },
            'message': 'fetched orders successfully!!',
            'responseCode': '000'
        })
    }
})
exports.worksGenerateExcelCSV = asyncHandler(async (req, res, next) => {

    let { from, to, searchText, corporateId, partnerId } = req.query;
    const { type } = req.params;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'transactionDate'

    let serviceAttribute = []
    let credentialAttribute = ['name', 'username']
    let transactionAttribute = []
    let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', 'ecomOrderStatus', "transactionDate", 'corporateTxnId', 'workspaceOrderStatus']

    let params = {
        from,
        to,
        accessKey,
        searchText,
        sort,
        serviceAttribute,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        corporateId,
        partnerId

    }
    
    const data = await worksExcelCSVData(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409))
    } else {
        const { buffer, fileType } = await generateExcelBufferAndType(data, type)
        return res.status(200).json({
            'status': true,
            'data': { buffer, fileType },
            'message': 'Fetched excel/csv datas successfully',
            'responseCode': '000'
        })
    }
})
exports.worksGeneratePDF = asyncHandler(async (req, res, next) => {

    let { from, to, searchText, corporateId, partnerId } = req.query;

    const sort = req.query.sort && req.query.sort === 'DESC' ? 'DESC' : 'ASC';
    let sortField = req.query.sortField || 'transactionDate'

    let serviceAttribute = []
    let credentialAttribute = ['name', 'username']
    let transactionAttribute = []
    let orderAttribute = ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', 'ecomOrderStatus', "transactionDate", 'corporateTxnId', 'workspaceOrderStatus']

    let params = {
        from,
        to,
        accessKey,
        searchText,
        sort,
        serviceAttribute,
        credentialAttribute,
        transactionAttribute,
        orderAttribute,
        sortField,
        corporateId,
        partnerId
    }

    const data = await worksExcelCSVData(params);
    if (!data) {
        return next(new ErrorResponse(`Something went wrong while generating report`, 500))
    } else if (data.length < 1) {
        return next(new ErrorResponse(`No data is available for export`, 409))
    }
    const templateDetails = {
        title: 'Works Report'
    }
    const reportHtmlWithStyle = reportPdfTemplate(data, templateDetails);
    let random = new Date().valueOf();

    // Create a browser instance with Puppeteer
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    // Set content to the page
    await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

    // Generate PDF using Puppeteer
    const outputFile = `report-${random}.pdf`;
    await page.pdf({
        scale: 0.8,
        path: outputFile,
        format: 'A4',
        preferCSSPageSize: true
    });


    const buffer = fs.readFileSync(outputFile);

    browser.close();

    fs.unlinkSync(outputFile);

    return res.status(200).json({
        status: true,
        message: 'report generated successfully.',
        data: {
            buffer,
            fileType: 'application/pdf'
        },
        responseCode: '000'
    });
})

exports.updateWorks = asyncHandler(async (req, res, next) => {
    try {
        let data = req.body
        let params = req.params
        const result = await updateOrder(params, data);
        if (!result) {
            return next(new ErrorResponse(`Something went wrong while updating works`, 500))
        } else {
            /**
             * On 06/06/2025 works flow updated and removed subscription flow, now it's a single payment service
             */

            // const orderDetails=await findOneOrderById(params?.id)
            // if(data?.workspaceOrderStatus=="COMPLETED"){
            //     console.log(data?.workspaceOrderStatus);

            //     const orderResponse = JSON.parse(orderDetails?.orderResponse)
            //     const startDate = moment().startOf('day').toDate();
            //     let endDate
            //     if(orderResponse?.planDetails?.billingCycle == "Monthly"){
            //         endDate = moment().add(29, 'days').endOf('day').toDate();
            //     } else {
            //         endDate = moment().add(364, 'days').endOf('day').toDate();
            //     }
            //     const subscriptionData={
            //         startDate,
            //         endDate,
            //         paymentRefId: orderDetails.corporateTxnId,
            //         price: orderDetails.amountInINR,
            //         billingType: orderResponse?.planDetails?.billingCycle,
            //         orderId: orderDetails.id,
            //         credentialId: orderDetails.credentialId,
            //     }
            //     console.log(subscriptionData);
            //     await createSubscription(subscriptionData)
            // }
            return res.status(200).json({
                'status': true,
                'data': { result },
                'message': 'Works updated successfully',
                'responseCode': '000'
            })
        }
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: "Something went wrong",
            data: {},
            responseCode: '001'
        })
    }
})