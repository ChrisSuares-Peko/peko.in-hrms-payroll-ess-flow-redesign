const { default: axios } = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');

const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { uploadFileToS3 } = require('../../utils/s3');
const { formatNumberWithLocalString } = require('../../utils/formatter');
const { refundWalletTransaction } = require('../../utils/walletTransaction');
const { cancelPGTransaction } = require('../../utils/pgRefund');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const emailer = require('../../utils/emailer');
const operatorsData = require('../../utils/operatorsData.json');

const orders = require('../../models/entities/order');
const Credential = require('../../models/entities/credential');

const { findOne: findOneServiceOperator } = require('../../models/use-cases/serviceOperator');
const { createNotification } = require('../../models/use-cases/notification');
const { fetchPartnerDetails } = require('../../models/use-cases/systemUser');
const {
    findCorporateDetails,
    findAllTransactionsForAdmin,
} = require('../../models/use-cases/globalBusinessSetup');
const { findAllApplicationsForAdmin } = require('../../models/use-cases/globalBusinessSetup/application');
const { findAllRenewalsForAdmin } = require('../../models/use-cases/globalBusinessSetup/renewal');

const {
    resolveGlobalBusinessSetupRejected,
    resolveGlobalBusinessSetupCompanyNameApproved,
    resolveGlobalBusinessSetupShareholderAndUBODetailsVerified,
    resolveGlobalBusinessSetupCompanyRegistrationCompleted,
    resolveGlobalBusinessSetupSetupDelayed,
} = require('../../utils/emailTemplates/globalBusinessSetup');

const { NODE_ENV } = process.env;
const accessKey = operatorsData.globalBusinessSetup.accessKey;
const categoryName = operatorsData.globalBusinessSetup.category;

// ─── Vendor helpers ──────────────────────────────────────────────────────────

// Base93 IN issues a static apiKey stored in `optional1`. Older AE pattern
// did email/password → /auth/login → bearer token; that's no longer used.
// Function kept (instead of inlining) so the ~13 admin call sites that do
// `const token = await generateToken()` work without further changes.
async function generateToken() {
    const serviceDetails = await findOneServiceOperator({ accessKey });
    if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return '';
    }
    return serviceDetails.vendor.optional1 || '';
}

const findActivityByNameAndProvider = async (activityName, providerName, key = accessKey) => {
    const serviceDetails = await findOneServiceOperator({ accessKey: key });
    if (!serviceDetails || serviceDetails.error) {
        throw new Error('Service is unavailable');
    }

    const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
    const token = await generateToken();

    const url = `${apiUrl}/licences/find-activity-by-name-and-provider?activity=${encodeURIComponent(activityName.trim())}&provider=${encodeURIComponent(providerName.trim())}`;

    const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    return response?.data?.data || null;
};

const findLicenceProviderByName = async (name, key = accessKey) => {
    const serviceDetails = await findOneServiceOperator({ accessKey: key });
    if (!serviceDetails || serviceDetails.error) {
        throw new Error('Service is unavailable');
    }

    const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
    const token = await generateToken();

    const url = `${apiUrl}/licences/find-licence-provider-by-name?name=${encodeURIComponent(name.trim())}`;
    const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    return response?.data?.data || null;
};

const getApplicationDetails = async (apiUrl, token, applicationId) => {
    try {
        const response = await axios({
            method: 'get',
            url: `${apiUrl}/applications/${applicationId}`,
            headers: { Authorization: `Bearer ${token}` },
        });
        return response?.data;
    } catch (err) {
        console.error('Failed to fetch application details', err?.response?.data || err.message);
        return null;
    }
};

// ─── Display helpers ─────────────────────────────────────────────────────────

const formatLicenseType = (type) => {
    if (!type) return 'N/A';
    return type
        .replace(/freezone/i, 'Free Zone')
        .replace(/mainland/i, 'Mainland')
        .replace(/^./, (str) => str.toUpperCase());
};

const formatStatus = (status) => {
    if (!status) return 'N/A';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
};

const formattedDateTime = (datetime) => {
    if (!datetime) return 'N/A';
    return new Date(datetime).toLocaleString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true,
    });
};

// ─── Plans CRUD (Base93) ─────────────────────────────────────────────────────

exports.createPlans = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }
        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        if (req.body.logo && req.body.logoFormat) {
            const filePath = `${NODE_ENV || 'staging'}/globalBusinessSetup`;
            const logoUrl = await uploadFileToS3(req.body.logo, filePath, req.body.logoFormat);
            if (!logoUrl) {
                return next(new ErrorResponse('Something went wrong while uploading logo', 500));
            }
            req.body.logo = logoUrl;
            delete req.body.logoFormat;
        }

        const response = await axios({
            method: 'post',
            url: `${apiUrl}/licences/create`,
            headers: {
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br',
                Authorization: `Bearer ${token}`,
            },
            data: req.body,
        });

        if (!response) {
            return next(new ErrorResponse('Something went wrong while creating plans', 404));
        }
        return res.status(200).json({
            status: true,
            message: 'Global Business Setup plan added successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'createPlans', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

exports.updatePlans = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }
        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        if (req.body.logo && req.body.logoFormat) {
            const filePath = `${NODE_ENV || 'staging'}/globalBusinessSetup`;
            const logoUrl = await uploadFileToS3(req.body.logo, filePath, req.body.logoFormat);
            if (!logoUrl) {
                return next(new ErrorResponse('Something went wrong while uploading logo', 500));
            }
            req.body.logo = logoUrl;
            delete req.body.logoFormat;
        }

        const response = await axios({
            method: 'put',
            url: `${apiUrl}/licences/${id}`,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            data: req.body,
        });

        if (!response) {
            return next(new ErrorResponse('Something went wrong while updating plans', 404));
        }
        return res.status(200).json({
            status: true,
            message: 'Global Business Setup plan updated successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'updatePlans', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

exports.updateStatus = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }

        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        const response = await axios({
            method: 'put',
            url: `${apiUrl}/licences/${id}`,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            data: req.body,
        });

        if (!response) {
            return next(new ErrorResponse('Something went wrong while updating status', 404));
        }

        return res.status(200).json({
            status: true,
            message: 'Status updated successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'updateStatus', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

exports.FetchAllPlans = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    const sortField = req.query.sortField || 'createdAt';

    const serviceDetails = await findOneServiceOperator({ accessKey });
    const { searchText } = req.query;

    const queryParams = new URLSearchParams();
    if (searchText) queryParams.append('searchText', searchText);

    if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
    }
    const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
    const token = await generateToken();
    const url = `${apiUrl}/licences/find?${queryParams.toString()}`;
    try {
        const response = await axios({
            method: 'get',
            url,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!response) {
            return next(new ErrorResponse('Something went wrong while fetching plans', 404));
        }

        const sortedData = [...response.data.data].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (!aVal || !bVal) return 0;
            const isDateField =
                ['createdat', 'updatedat'].includes(sortField.toLowerCase()) ||
                sortField.toLowerCase().includes('date');
            const aValue = isDateField ? new Date(aVal).getTime() : aVal.toString().toLowerCase();
            const bValue = isDateField ? new Date(bVal).getTime() : bVal.toString().toLowerCase();
            if (aValue < bValue) return sort === 'ASC' ? -1 : 1;
            if (aValue > bValue) return sort === 'ASC' ? 1 : -1;
            return 0;
        });

        const start = (page - 1) * itemsPerPage;
        const paginatedData = sortedData.slice(start, start + itemsPerPage);

        return res.status(200).json({
            status: true,
            message: 'Plans fetched successfully!',
            responseCode: '000',
            data: {
                data: paginatedData,
                currentPage: page,
                totalItems: sortedData.length,
                totalPages: Math.ceil(sortedData.length / itemsPerPage),
            },
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'FetchAllPlans', message: "FetchAllPlans", data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

exports.globalBusinessSetupPDF = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }
        const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
        const sortField = req.query.sortField || 'createdAt';

        const { searchText } = req.query;
        const queryParams = new URLSearchParams();
        if (searchText) queryParams.append('searchText', searchText);

        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();
        const url = `${apiUrl}/licences/find?${queryParams.toString()}`;

        const response = await axios({
            method: 'get',
            url,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!response || !response.data) {
            return next(new ErrorResponse('Something went wrong while fetching plans', 404));
        }

        const data = response.data.data;
        if (!data) {
            return next(new ErrorResponse('Something went wrong while generating report', 400));
        } else if (data.length < 1) {
            return next(new ErrorResponse('No data is available for export', 400));
        }

        const sortedData = [...data].sort((a, b) => {
            const aDate = new Date(a[sortField] || a.createdAt).getTime();
            const bDate = new Date(b[sortField] || b.createdAt).getTime();
            return sort === 'ASC' ? aDate - bDate : bDate - aDate;
        });

        const templateDetails = { title: 'Global Business Setup' };

        const formattedData = sortedData.map((item) => ({
            Date: formattedDateTime(item.createdAt),
            Name: item.name,
            Heading: item?.heading,
            'License Type': formatLicenseType(item?.licenceType),
            'Visa Fee': item.fee?.visa,
            Status: formatStatus(item.status),
        }));

        const reportHtmlWithStyle = reportPdfTemplate(formattedData, templateDetails);
        const random = Date.now();

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });

        const outputFile = `report-${random}.pdf`;
        await page.pdf({ scale: 0.6, path: outputFile, format: 'A4', preferCSSPageSize: true });
        const buffer = fs.readFileSync(outputFile);
        await browser.close();
        fs.unlinkSync(outputFile);

        return res.status(200).json({
            status: true,
            message: 'Report generated successfully.',
            data: { buffer, fileType: 'application/pdf' },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'globalBusinessSetupPDF', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

exports.globalBusinessSetupCSV = asyncHandler(async (req, res, next) => {
    try {
        const { type } = req.params;
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }

        const { searchText } = req.query;
        const queryParams = new URLSearchParams();
        const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
        const sortField = req.query.sortField || 'createdAt';
        if (searchText) queryParams.append('searchText', searchText);

        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();
        const url = `${apiUrl}/licences/find?${queryParams.toString()}`;

        const response = await axios({
            method: 'get',
            url,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!response || !response.data) {
            return next(new ErrorResponse('Something went wrong while fetching plans', 404));
        }
        const data = response.data.data;
        if (!data) {
            return next(new ErrorResponse('Something went wrong while generating report', 500));
        } else if (data.length < 1) {
            return next(new ErrorResponse('No data is available for export', 500));
        }

        const sortedData = [...data].sort((a, b) => {
            const aDate = new Date(a[sortField] || a.createdAt).getTime();
            const bDate = new Date(b[sortField] || b.createdAt).getTime();
            return sort === 'ASC' ? aDate - bDate : bDate - aDate;
        });

        const formattedData = sortedData.map((item) => ({
            Date: item.createdAt ? formattedDateTime(item.createdAt) : 'N/A',
            Name: item.name,
            Heading: item?.heading || 'N/A',
            'License Type': formatLicenseType(item?.licenceType),
            'Visa Fee': item.fee?.visa,
            Status: formatStatus(item.status),
        }));

        const { buffer, fileType } = await generateExcelBufferAndType(formattedData, type);
        return res.status(200).json({
            status: true,
            data: { buffer, fileType },
            message: 'Fetched excel/csv datas successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'globalBusinessSetupCSV', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

// ─── Combined transactions (DB + vendor applications) ────────────────────────

exports.findAllGlobalBusinessSetupTransactionsAndCount = asyncHandler(async (req, res, next) => {
    try {
        const { from, to, searchText } = req.query;
        const corporateId = req.user.id;

        const sort = req.query.sort === 'DESC' ? 'DESC' : 'ASC';
        const filter = req.query.filter || undefined;

        const transactionsData = await findAllTransactionsForAdmin({
            from,
            to,
            searchText,
            sort,
            filter,
            corporateId,
            serviceAttribute: [],
            credentialAttribute: ['username', 'name'],
            transactionAttribute: [],
            orderAttribute: ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', 'transactionDate', 'corporateTxnId'],
            sortField: 'transactionDate',
        });

        if (!transactionsData) {
            return next(new ErrorResponse('Something went wrong while fetching global business setup transactions from DB', 500));
        }

        return res.status(200).json({
            status: true,
            data: {
                result: transactionsData.rows,
                totalData: transactionsData.count,
            },
            message: 'Global Business Setup transactions fetched successfully!',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'findAllGlobalBusinessSetupTransactionsAndCount', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

exports.FetchAllApplications = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }

        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        const response = await axios({
            method: 'get',
            url: `${apiUrl}/applications/all`,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!response || !response.data) {
            return next(new ErrorResponse('Something went wrong while fetching applications.', 404));
        }

        return res.status(200).json({
            status: true,
            message: 'Applications fetched successfully!',
            responseCode: '000',
            data: response.data.data,
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'FetchAllApplications', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

// Internal: produce the merged applications dataset shared by list/PDF/CSV endpoints.
const buildCombinedApplicationsDataset = async (req) => {
    const { from, to, searchText, sort, filter, partnerId } = req.query;
    const corporateId = req.user.role === 'SYSTEM_USER' ? req.query.corporateId : req.user.id;
    const sortOrder = sort === 'DESC' ? 'DESC' : 'ASC';

    const transactionsResult = await findAllTransactionsForAdmin({
        from,
        to,
        searchText,
        sort: sortOrder,
        filter,
        partnerId,
        corporateId,
        serviceAttribute: [],
        credentialAttribute: ['id', 'username', 'name', 'email', 'registeredBy'],
        transactionAttribute: [],
        orderAttribute: ['id', 'amountInINR', 'paymentMode', 'status', 'orderResponse', 'transactionDate', 'corporateTxnId'],
        sortField: 'transactionDate',
    });

    const transactions = transactionsResult.rows.map((t) => (typeof t.get === 'function' ? t.get({ plain: true }) : t));

    const serviceDetails = await findOneServiceOperator({ accessKey });
    if (serviceDetails?.error) {
        const err = new Error('Apologies, the service is unavailable.');
        err.statusCode = 400;
        throw err;
    }

    const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
    const token = await generateToken();

    const applicationResponse = await axios.get(`${apiUrl}/applications/all`, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });

    const applications = applicationResponse?.data?.data || [];

    const transactionMap = transactions.reduce((acc, txn) => {
        const txnId = txn?.order?.corporateTxnId?.toString();
        if (txnId) acc[txnId] = txn;
        return acc;
    }, {});

    let mergedApplications = applications.map((app) => {
        const txn = transactionMap[app.corporateTxnId?.toString()];
        return {
            ...app,
            credential: txn?.credential || null,
            transactionInfo: txn?.order || null,
        };
    });

    if (searchText?.trim()) {
        const searchLower = searchText.toLowerCase();
        mergedApplications = mergedApplications.filter(
            (app) =>
                app?.licence?.name?.toLowerCase().includes(searchLower) ||
                app?.licence?.description?.toLowerCase().includes(searchLower) ||
                app?.applicationStatus?.toLowerCase().includes(searchLower) ||
                app?.paymentStatus?.toLowerCase().includes(searchLower) ||
                app?.companyDetails?.proposedCompanyName1?.toLowerCase().includes(searchLower) ||
                app?.companyDetails?.proposedCompanyName2?.toLowerCase().includes(searchLower) ||
                app?.companyDetails?.proposedCompanyName3?.toLowerCase().includes(searchLower) ||
                app?.companyDetails?.shortBusinessDescription?.toLowerCase().includes(searchLower) ||
                app?.corporateTxnId?.toString().includes(searchLower) ||
                app?.credential?.username?.toLowerCase().includes(searchLower) ||
                app?.credential?.name?.toLowerCase().includes(searchLower) ||
                app?.credential?.email?.toLowerCase().includes(searchLower)
        );
    }
    if (from && to) {
        const fromDate = new Date(from);
        const toDate = new Date(to);
        toDate.setDate(toDate.getDate() + 1);
        mergedApplications = mergedApplications.filter((app) => {
            const createdAt = new Date(app.createdAt);
            return createdAt >= fromDate && createdAt < toDate;
        });
    }
    if (partnerId) {
        if (partnerId === 'default') {
            mergedApplications = mergedApplications.filter((app) => !app?.credential?.registeredBy);
        } else {
            mergedApplications = mergedApplications.filter(
                (app) => app?.credential?.registeredBy?.toString() === partnerId.toString()
            );
        }
    }
    if (corporateId) {
        mergedApplications = mergedApplications.filter(
            (app) => app?.credential?.id?.toString() === corporateId.toString()
        );
    }

    return mergedApplications;
};

exports.FetchCombinedGlobalBusinessSetupTransactions = asyncHandler(async (req, res, next) => {
    try {
        const { page, itemsPerPage } = req.query;
        const merged = await buildCombinedApplicationsDataset(req);

        const totalCount = merged.length;
        const currentPage = parseInt(page) || 1;
        const perPage = parseInt(itemsPerPage) || totalCount;
        const paginated = merged.slice((currentPage - 1) * perPage, currentPage * perPage);

        return res.status(200).json({
            status: true,
            data: {
                result: paginated,
                totalCount,
                currentPage,
                totalPages: Math.ceil(totalCount / perPage),
            },
            message: 'Applications fetched successfully!',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'FetchCombinedGlobalBusinessSetupTransactions', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message || 'Server error', error.statusCode || 500));
    }
});

exports.globalBusinessSetupReportsPDFNew = asyncHandler(async (req, res, next) => {
    try {
        const { page, itemsPerPage } = req.query;
        const merged = await buildCombinedApplicationsDataset(req);
        const totalCount = merged.length;
        const currentPage = parseInt(page) || 1;
        const perPage = parseInt(itemsPerPage) || totalCount;
        const paginated = merged.slice((currentPage - 1) * perPage, currentPage * perPage);

        if (paginated.length < 1) {
            return next(new ErrorResponse('No data is available for export', 500));
        }

        const templateDetails = { title: 'Global Business Setup Reports' };
        const formattedData = paginated.map((item) => ({
            'Transaction Date': formattedDateTime(item.createdAt),
            'Transaction ID': item.corporateTxnId,
            'Corporate Name': item?.credential?.name || 'N/A',
            'Corporate ID': item?.credential?.username || 'N/A',
            'Partner Name': item?.credential?.registeredBy || 'N/A',
            'Plan Name': item?.licence?.name,
            Country: item?.licence?.country?.name || item?.country?.name || 'N/A',
            Amount: item?.totalAmount,
            'Payment Status': item?.paymentStatus,
            'Application Status': item?.applicationStatus,
        }));

        const reportHtmlWithStyle = reportPdfTemplate(formattedData, templateDetails);
        const random = new Date().valueOf();

        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const pages = await browser.newPage();
        await pages.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });
        const outputFile = `report-${random}.pdf`;
        await pages.pdf({ scale: 0.6, path: outputFile, format: 'A4', preferCSSPageSize: true });
        const buffer = fs.readFileSync(outputFile);
        await browser.close();
        fs.unlinkSync(outputFile);

        return res.status(200).json({
            status: true,
            message: 'report generated successfully.',
            data: { buffer, fileType: 'application/pdf' },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'globalBusinessSetupReportsPDFNew', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message || 'Server error', error.statusCode || 500));
    }
});

exports.globalBusinessSetupReportsCSVNew = asyncHandler(async (req, res, next) => {
    try {
        const { type } = req.params;
        const { page, itemsPerPage } = req.query;
        const merged = await buildCombinedApplicationsDataset(req);
        const totalCount = merged.length;
        const currentPage = parseInt(page) || 1;
        const perPage = parseInt(itemsPerPage) || totalCount;
        const paginated = merged.slice((currentPage - 1) * perPage, currentPage * perPage);

        if (paginated.length < 1) {
            return next(new ErrorResponse('No data is available for export', 500));
        }

        const formattedData = paginated.map((item) => ({
            'Transaction Date': formattedDateTime(item.createdAt),
            'Transaction ID': item.corporateTxnId?.toString(),
            'Corporate Name': item?.credential?.name || 'N/A',
            'Corporate ID': item?.credential?.username || 'N/A',
            'Partner Name': item?.credential?.registeredBy || 'N/A',
            'Plan Name': item?.licence?.name,
            Country: item?.licence?.country?.name || item?.country?.name || 'N/A',
            Amount: item?.totalAmount,
            'Payment Status': formatStatus(item?.paymentStatus),
            'Application Status': formatStatus(item?.applicationStatus),
        }));

        const { buffer, fileType } = await generateExcelBufferAndType(formattedData, type);
        return res.status(200).json({
            status: true,
            data: { buffer, fileType },
            message: 'Fetched excel/csv datas successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'globalBusinessSetupReportsCSVNew', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message || 'Server error', error.statusCode || 500));
    }
});

// ─── Status update + email ───────────────────────────────────────────────────

exports.AddCompanyInfo = asyncHandler(async (req, res, next) => {
    try {
        const data = req.body;
        const { status: applicationStatus, remarks } = data;

        if (!applicationStatus) {
            return next(new ErrorResponse('Status is required', 400));
        }

        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }

        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();
        const user = await findCorporateDetails(data);
        const appDetails = await getApplicationDetails(apiUrl, token, data.id);
        const proposedName = appDetails?.data?.companyDetails?.proposedCompanyName1 || 'N/A';

        let partnerDetails;
        partnerDetails = await fetchPartnerDetails(user.credential.registeredBy);

        if (user?.credential) {
            const { email, username, name } = user.credential;
            const credentialId = user.credentialId;
            const partnerId = user.credential.registeredBy || user.registeredBy || null;
            const logTraceId = req?.LogTraceId;

            // subject doubles as the fallbackSubject when no admin template is published
            const notifications = {
                NAME_APPROVED: {
                    subject: 'Company Name Approved',
                    resolve: (fallbackSubject) => resolveGlobalBusinessSetupCompanyNameApproved({ name, proposedName, partnerDetails, partnerId, logTraceId, fallbackSubject }),
                    title: 'Company Name Reserved',
                    brief: `Your proposed company name ${proposedName} has been approved. We're moving to the next step in your setup.`,
                },
                SHAREHOLDER_VERIFIED: {
                    subject: 'Shareholder & UBO Details Verified',
                    resolve: (fallbackSubject) => resolveGlobalBusinessSetupShareholderAndUBODetailsVerified({ name, partnerDetails, partnerId, logTraceId, fallbackSubject }),
                    title: 'Shareholder & UBO Verified',
                    brief: 'All shareholder and UBO details were successfully verified. Your application has progressed to the next stage.',
                },
                COMPLETED: {
                    subject: 'Company Registration Completed',
                    resolve: (fallbackSubject) => resolveGlobalBusinessSetupCompanyRegistrationCompleted({ name, partnerDetails, id: data.id, partnerId, logTraceId, fallbackSubject }),
                    title: 'Company Registered',
                    brief: 'Your company has been officially registered and the trade license was issued. Documents are now available for download.',
                },
                DELAYED: {
                    subject: 'Update on Your Application',
                    resolve: (fallbackSubject) => resolveGlobalBusinessSetupSetupDelayed({ name, partnerDetails, id: data.id, partnerId, logTraceId, fallbackSubject }),
                    title: 'Setup Delayed – Additional Review',
                    brief: 'Your application is under additional review by the licensing authority. We’ll notify you once there’s an update.',
                },
                REJECTED: {
                    subject: 'Corrections Needed for Your Company Setup',
                    resolve: (fallbackSubject) => resolveGlobalBusinessSetupRejected({ name, partnerDetails, id: data.id, partnerId, logTraceId, fallbackSubject }),
                    title: 'Action Required: Corrections Needed',
                    brief: 'Some documents or details need to be corrected. Please review your application and re-upload the required items.',
                },
            };

            const notify = notifications[applicationStatus];
            if (notify) {
                const { subject, html, sender } = await notify.resolve(notify.subject);
                await emailer.email(email, subject, html, undefined, sender);
                await createNotification(
                    {
                        notificationTitle: notify.title,
                        notificationBrief: notify.brief,
                        notificationTo: [username],
                        notificationCategory: 'CORPORATE',
                        notificationBy: 'ADMIN',
                        accessKey,
                        action: '1',
                    },
                    credentialId
                );
            }
        }

        const response = await axios({
            method: 'patch',
            url: `${apiUrl}/applications/${data.id}`,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            data: { applicationStatus, corrections: remarks },
        });

        if (!response?.data) {
            return next(new ErrorResponse('Something went wrong while updating application.', 404));
        }

        return res.status(200).json({
            status: true,
            message: 'Application status updated successfully!',
            responseCode: '000',
            data: response.data,
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'AddCompanyInfo', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

// ─── Activities CRUD ─────────────────────────────────────────────────────────

exports.createActivities = asyncHandler(async (req, res, next) => {
    try {
        const { activity, licenceProvider } = req.body;

        if (!activity || !licenceProvider) {
            return next(new ErrorResponse('Activity name and license provider are required', 400));
        }
        const existing = await findActivityByNameAndProvider(activity.trim(), licenceProvider.trim());
        if (existing) {
            return next(new ErrorResponse(`Activity "${activity}" already exists for this license provider `, 400));
        }
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }
        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        const response = await axios({
            method: 'post',
            url: `${apiUrl}/licences/create-activity`,
            headers: {
                'Content-Type': 'application/json',
                'Accept-Encoding': 'gzip, deflate, br',
                Authorization: `Bearer ${token}`,
            },
            data: req.body,
        });

        if (!response) {
            return next(new ErrorResponse('Something went wrong while creating activities', 404));
        }
        return res.status(200).json({
            status: true,
            message: 'Global Business Setup activity added successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'createActivities', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

exports.updateActivity = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }
        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        const response = await axios({
            method: 'put',
            url: `${apiUrl}/activity/${id}`,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            data: req.body,
        });

        if (!response) {
            return next(new ErrorResponse('Something went wrong while updating activity', 404));
        }
        return res.status(200).json({
            status: true,
            message: 'Global Business Setup activity updated successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'updateActivity', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message || 'Failed to update activity', 500));
    }
});

exports.deleteActivity = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }
        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        const response = await axios({
            method: 'delete',
            url: `${apiUrl}/activity/${id}`,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            data: req.body,
        });

        if (!response) {
            return next(new ErrorResponse('Something went wrong while updating activity', 404));
        }
        return res.status(200).json({
            status: true,
            message: 'Global Business Setup activity deleted successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'deleteActivity', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message || 'Failed to delete activity', 500));
    }
});

exports.FetchAllActivities = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    const sortField = req.query.sortField || 'createdAt';

    const serviceDetails = await findOneServiceOperator({ accessKey });
    const { searchText, licenseType } = req.query;

    const queryParams = new URLSearchParams();
    if (searchText) queryParams.append('searchText', searchText);

    if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
        return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
    }

    if (licenseType) queryParams.append('licenseType', licenseType);

    const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
    const token = await generateToken();
    const url = `${apiUrl}/licences/findAllActivities?${queryParams.toString()}`;

    try {
        const response = await axios({
            method: 'get',
            url,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!response) {
            return next(new ErrorResponse('something went wrong while fetching plans ', 404));
        }
        const sortedData = [...response.data.data].sort((a, b) => {
            const aVal = a[sortField];
            const bVal = b[sortField];
            if (!aVal || !bVal) return 0;
            const isDateField =
                ['createdat', 'updatedat'].includes(sortField.toLowerCase()) ||
                sortField.toLowerCase().includes('date');
            const aValue = isDateField ? new Date(aVal).getTime() : aVal.toString().toLowerCase();
            const bValue = isDateField ? new Date(bVal).getTime() : bVal.toString().toLowerCase();
            if (aValue < bValue) return sort === 'ASC' ? -1 : 1;
            if (aValue > bValue) return sort === 'ASC' ? 1 : -1;
            return 0;
        });

        const start = (page - 1) * itemsPerPage;
        const paginatedData = sortedData.slice(start, start + itemsPerPage);

        return res.status(200).json({
            status: true,
            message: 'Plans fetched successfully!',
            responseCode: '000',
            data: {
                data: paginatedData,
                currentPage: page,
                totalItems: sortedData.length,
                totalPages: Math.ceil(sortedData.length / itemsPerPage),
            },
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'FetchAllActivities', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

// ─── Refund (IN pattern: Cashfree for PG, wallet for WALLET) ────────────────

exports.refundTransactionGlobalBusinessSetup = asyncHandler(async (req, res, next) => {
    try {
        const { corporateTxnId, refundAmount: requestedRefundAmount } = req.body;

        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }

        const order = await orders.findOne({
            where: { corporateTxnId },
            include: [{ model: Credential }],
        });

        if (!order) return next(new ErrorResponse('No order found', 404));
        if (order.status === 'REFUNDED') return next(new ErrorResponse('This is already refunded', 400));

        const orderResponse = JSON.parse(order.orderResponse || '{}');
        const { paymentMode, credential, providerId } = order;
        const { username, id: credentialId, registeredBy } = credential || {};

        const updateDetails = {
            corporateTxnId,
            status: 'REFUNDED',
            providerId: providerId || 'Not Available',
            message: 'Refund initiated',
            registeredById: registeredBy || null,
        };

        if (paymentMode === 'WALLET') {
            await refundWalletTransaction(updateDetails);
        } else if (['PAYMENT GATEWAY', 'PAYMENT GATEWAY + WALLET', 'PG', 'PG + WALLET'].includes(paymentMode)) {
            const refundPGResponse = await cancelPGTransaction(corporateTxnId, requestedRefundAmount);
            if (!refundPGResponse?.status) {
                return next(new ErrorResponse(refundPGResponse?.message || 'Apologies, Something went wrong while refunding', 400));
            }
            await refundWalletTransaction(updateDetails);
        } else {
            return next(new ErrorResponse('Refund is not available for this payment mode', 400));
        }

        await order.save();
        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        const response = await axios({
            method: 'patch',
            url: `${apiUrl}/applications/${orderResponse.applicationId}`,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            data: { paymentStatus: 'REFUNDED' },
        });

        if (!response?.data) {
            return next(new ErrorResponse('Something went wrong while updating application.', 404));
        }

        await createNotification(
            {
                notificationTitle: 'Global Business Setup - Refund successful',
                notificationBrief: `Refund of ₹${formatNumberWithLocalString(requestedRefundAmount)} for Global Business Setup was successful. Transaction ID: ${corporateTxnId}.`,
                notificationTo: [username],
                notificationCategory: 'CORPORATE',
                notificationBy: 'ADMIN',
                accessKey,
                action: '1',
            },
            credentialId
        );

        return res.status(200).json({
            status: true,
            message: 'Refunded successfully',
            responseCode: '000',
            data: {},
        });
    } catch (error) {
        customLog(null, 'error', { fn: 'refundTransactionGlobalBusinessSetup', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse('Something went wrong', 400));
    }
});

// ─── Bulk activity upload ────────────────────────────────────────────────────

exports.bulkExcelUploadActivities = asyncHandler(async (req, res, next) => {
    try {
        const activitiesJsonData = req.body.productsJsonData;
        const uploadType = req.body.uploadType;
        let hasErrors = false;

        if (!activitiesJsonData || activitiesJsonData.length === 0) {
            return next(new ErrorResponse('No data found for activities bulk upload', 400));
        }

        if (activitiesJsonData.length > 50000) {
            return next(new ErrorResponse('Exceeded maximum limit for bulk upload (50,000 per sheet)', 400));
        }

        const serviceDetails = await findOneServiceOperator({ accessKey });
        if (!serviceDetails || serviceDetails.error) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }

        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();

        const results = await Promise.all(
            activitiesJsonData.map(async (activityObj) => {
                const { Activity, LicenseProvider } = activityObj;
                const providerName = LicenseProvider?.trim();
                const activityName = Activity?.trim();

                let licence = null;
                if (providerName) {
                    licence = await findLicenceProviderByName(providerName);
                }

                if (licence && activityObj.status) {
                    const existing = await findActivityByNameAndProvider(activityName, licence._id.toString());
                    if (existing) {
                        activityObj.status = false;
                        activityObj.errors.push(
                            `Activity "${activityName}" with the license provider "${providerName}" has already been uploaded.`
                        );
                    }
                }
                if (licence) {
                    activityObj.licenseType = licence.licenceType;
                    activityObj.licenseProvider = { _id: licence._id, name: licence.name };
                }

                return activityObj;
            })
        );

        hasErrors = results.some((r) => !r.status || (r.errors && r.errors.length > 0));

        if (!hasErrors && uploadType === 'JSON') {
            try {
                const uploadConfig = {
                    method: 'post',
                    url: `${apiUrl}/licences/bulk-upload-activities`,
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    data: {
                        activities: results.map((r) => ({
                            activity: r.Activity,
                            licenseProvider: r.licenseProvider._id,
                            licenseType: r.licenseType,
                        })),
                    },
                };
                const response = await axios(uploadConfig);
                return res.status(200).json({
                    status: true,
                    message: 'Activities added successfully',
                    responseCode: '000',
                    data: { activities: response.data?.data || [], activitiesCreated: true },
                });
            } catch (err) {
                customLog(req?.LogTraceId, 'error', { fn: 'bulkExcelUploadActivities', message: err.message, data: err.response?.data });
                return next(new ErrorResponse(err.message, 500));
            }
        }

        return res.status(200).json({
            status: true,
            message: 'Please review activities',
            responseCode: '000',
            data: { activitiesJsonData: results, activitiesCreated: false },
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'bulkExcelUploadActivities', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message || 'Internal Server Error', 500));
    }
});

// ─── Activity exports ────────────────────────────────────────────────────────

exports.globalBusinessSetupActivityPDF = asyncHandler(async (req, res, next) => {
    try {
        const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
        const sortField = req.query.sortField || 'createdAt';

        const serviceDetails = await findOneServiceOperator({ accessKey });
        const { searchText, licenseType } = req.query;

        const queryParams = new URLSearchParams();
        if (searchText) queryParams.append('searchText', searchText);

        if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }

        if (licenseType) queryParams.append('licenseType', licenseType);

        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();
        const url = `${apiUrl}/licences/findAllActivities?${queryParams.toString()}`;

        const response = await axios({
            method: 'get',
            url,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!response || !response.data) {
            return next(new ErrorResponse('Something went wrong while fetching plans', 404));
        }
        const data = response.data.data;
        if (!data) return next(new ErrorResponse('Something went wrong while generating report', 400));
        if (data.length < 1) return next(new ErrorResponse('No data is available for export', 400));

        const sortedData = [...data].sort((a, b) => {
            const aDate = new Date(a[sortField] || a.createdAt).getTime();
            const bDate = new Date(b[sortField] || b.createdAt).getTime();
            return sort === 'ASC' ? aDate - bDate : bDate - aDate;
        });

        const templateDetails = { title: 'Global Business Setup Activities' };
        const formattedData = sortedData.map((item) => ({
            Date: formattedDateTime(item.createdAt),
            Activity: item?.activity,
            'License Provider': item?.licenceProvider?.name,
            'License Type': formatLicenseType(item?.licenceProvider?.licenceType),
        }));

        const reportHtmlWithStyle = reportPdfTemplate(formattedData, templateDetails);
        const random = Date.now();
        const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(reportHtmlWithStyle, { waitUntil: 'domcontentloaded' });
        const outputFile = `report-${random}.pdf`;
        await page.pdf({ scale: 0.6, path: outputFile, format: 'A4', preferCSSPageSize: true });
        const buffer = fs.readFileSync(outputFile);
        await browser.close();
        fs.unlinkSync(outputFile);

        return res.status(200).json({
            status: true,
            message: 'Report generated successfully.',
            data: { buffer, fileType: 'application/pdf' },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'globalBusinessSetupActivityPDF', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

exports.globalBusinessSetupActivityCSV = asyncHandler(async (req, res, next) => {
    try {
        const { type } = req.params;
        const sort = req.query.sort && req.query.sort === 'ASC' ? 'ASC' : 'DESC';
        const sortField = req.query.sortField || 'createdAt';

        const serviceDetails = await findOneServiceOperator({ accessKey });
        const { searchText, licenseType } = req.query;

        const queryParams = new URLSearchParams();
        if (searchText) queryParams.append('searchText', searchText);

        if (!serviceDetails || Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse('Apologies, the service you are trying to access is currently unavailable.', 400));
        }
        if (licenseType) queryParams.append('licenseType', licenseType);

        const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
        const token = await generateToken();
        const url = `${apiUrl}/licences/findAllActivities?${queryParams.toString()}`;

        const response = await axios({
            method: 'get',
            url,
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        });
        if (!response || !response.data) {
            return next(new ErrorResponse('Something went wrong while fetching plans', 404));
        }
        const data = response.data.data;
        if (!data) return next(new ErrorResponse('Something went wrong while generating report', 500));
        if (data.length < 1) return next(new ErrorResponse('No data is available for export', 500));

        const sortedData = [...data].sort((a, b) => {
            const aDate = new Date(a[sortField] || a.createdAt).getTime();
            const bDate = new Date(b[sortField] || b.createdAt).getTime();
            return sort === 'ASC' ? aDate - bDate : bDate - aDate;
        });

        const formattedData = sortedData.map((item) => ({
            Date: formattedDateTime(item.createdAt),
            Activity: item?.activity,
            'License Provider': item?.licenceProvider?.name,
            'License Type': formatLicenseType(item?.licenceProvider?.licenceType),
        }));

        const { buffer, fileType } = await generateExcelBufferAndType(formattedData, type);
        return res.status(200).json({
            status: true,
            data: { buffer, fileType },
            message: 'Fetched excel/csv datas successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { fn: 'globalBusinessSetupActivityCSV', message: error?.message, data: error?.response?.data });
        return next(new ErrorResponse(error.message, 500));
    }
});

// ─── Admin cache reports (Mongo) ─────────────────────────────────────────────

exports.adminListGlobalBusinessSetupApplications = asyncHandler(async (req, res, next) => {
    try {
        const { page = 1, itemsPerPage = 10, searchText, sort } = req.query;
        const isPaidRaw = req.query.isPaid;
        const isPaid = isPaidRaw === 'true' ? true : isPaidRaw === 'false' ? false : undefined;

        const result = await findAllApplicationsForAdmin({
            page: Number(page) || 1,
            itemsPerPage: Number(itemsPerPage) || 10,
            searchText,
            isPaid,
            sort,
        });

        return res.status(200).json({
            status: true,
            message: 'Global Business Setup applications fetched successfully.',
            responseCode: '000',
            data: result,
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: 'ERROR from adminListGlobalBusinessSetupApplications',
            error: error?.message,
        });
        return next(new ErrorResponse('Something went wrong while fetching applications', 500));
    }
});

exports.adminListGlobalBusinessSetupRenewals = asyncHandler(async (req, res, next) => {
    try {
        const { page = 1, itemsPerPage = 10, searchText, sort } = req.query;

        const result = await findAllRenewalsForAdmin({
            page: Number(page) || 1,
            itemsPerPage: Number(itemsPerPage) || 10,
            searchText,
            sort,
        });

        return res.status(200).json({
            status: true,
            message: 'Global Business Setup renewals fetched successfully.',
            responseCode: '000',
            data: result,
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', {
            message: 'ERROR from adminListGlobalBusinessSetupRenewals',
            error: error?.message,
        });
        return next(new ErrorResponse('Something went wrong while fetching renewals', 500));
    }
});

const reshapeApplicationsForExport = (rows) =>
    rows.map((app) => ({
        'Application No.': app.application_id || app.tracking_id || app.vendor_app_id || 'N/A',
        Reference: app.reference_id || 'N/A',
        'Proposed Name': app.proposed_name || 'N/A',
        Country: app.country?.name || 'N/A',
        Type: app.type === 'freezone' ? 'Free Zone' : app.type || 'N/A',
        Freezone: app.freezone || 'N/A',
        Paid: app.is_paid ? 'Yes' : 'No',
        'Tracking ID': app.tracking_id || 'N/A',
        Created: app.vendor_created_at ? new Date(app.vendor_created_at).toISOString() : 'N/A',
        Synced: app.synced_at ? new Date(app.synced_at).toISOString() : 'N/A',
    }));

const reshapeRenewalsForExport = (rows) =>
    rows.map((r) => ({
        'Renewal ID': r.application_id || 'N/A',
        'Renewal Type': r.renewal_type || 'N/A',
        Reference: r.reference_id || 'N/A',
        'Company Name': r.company_name || 'N/A',
        Country: r.country_name || 'N/A',
        Freezone: r.freezone || 'N/A',
        'Due Date': r.due_date ? new Date(r.due_date).toISOString().split('T')[0] : 'N/A',
        Created: r.vendor_created_at ? new Date(r.vendor_created_at).toISOString() : 'N/A',
        Synced: r.synced_at ? new Date(r.synced_at).toISOString() : 'N/A',
    }));

async function renderReportToPdfBuffer(rows, title) {
    const html = reportPdfTemplate(rows, { title });
    const random = new Date().valueOf();
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'domcontentloaded' });
        const outputFile = `report-${random}.pdf`;
        await page.pdf({ scale: 0.8, path: outputFile, format: 'A4', preferCSSPageSize: true });
        const buffer = fs.readFileSync(outputFile);
        fs.unlinkSync(outputFile);
        return buffer;
    } finally {
        await browser.close();
    }
}

exports.adminExportGlobalBusinessSetupApplicationsCSVExcel = asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const { searchText, sort } = req.query;
    const isPaidRaw = req.query.isPaid;
    const isPaid = isPaidRaw === 'true' ? true : isPaidRaw === 'false' ? false : undefined;

    const result = await findAllApplicationsForAdmin({
        page: 1,
        itemsPerPage: 1_000_000,
        searchText,
        isPaid,
        sort,
    });

    const rows = result?.applications || [];
    if (!rows.length) {
        return next(new ErrorResponse('No data is available for export', 409));
    }

    const data = reshapeApplicationsForExport(rows);
    const { buffer, fileType } = await generateExcelBufferAndType(data, type);
    return res.status(200).json({
        status: true,
        message: 'Applications report generated successfully.',
        responseCode: '000',
        data: { buffer, fileType },
    });
});

exports.adminExportGlobalBusinessSetupApplicationsPDF = asyncHandler(async (req, res, next) => {
    const { searchText, sort } = req.query;
    const isPaidRaw = req.query.isPaid;
    const isPaid = isPaidRaw === 'true' ? true : isPaidRaw === 'false' ? false : undefined;

    const result = await findAllApplicationsForAdmin({
        page: 1,
        itemsPerPage: 1_000_000,
        searchText,
        isPaid,
        sort,
    });

    const rows = result?.applications || [];
    if (!rows.length) {
        return next(new ErrorResponse('No data is available for export', 409));
    }

    const data = reshapeApplicationsForExport(rows);
    const buffer = await renderReportToPdfBuffer(data, 'Global Business Setup - Applications Report');
    return res.status(200).json({
        status: true,
        message: 'Applications PDF generated successfully.',
        responseCode: '000',
        data: { buffer, fileType: 'application/pdf' },
    });
});

exports.adminExportGlobalBusinessSetupRenewalsCSVExcel = asyncHandler(async (req, res, next) => {
    const { type } = req.params;
    const { searchText, sort } = req.query;

    const result = await findAllRenewalsForAdmin({
        page: 1,
        itemsPerPage: 1_000_000,
        searchText,
        sort,
    });

    const rows = result?.renewals || [];
    if (!rows.length) {
        return next(new ErrorResponse('No data is available for export', 409));
    }

    const data = reshapeRenewalsForExport(rows);
    const { buffer, fileType } = await generateExcelBufferAndType(data, type);
    return res.status(200).json({
        status: true,
        message: 'Renewals report generated successfully.',
        responseCode: '000',
        data: { buffer, fileType },
    });
});

exports.adminExportGlobalBusinessSetupRenewalsPDF = asyncHandler(async (req, res, next) => {
    const { searchText, sort } = req.query;

    const result = await findAllRenewalsForAdmin({
        page: 1,
        itemsPerPage: 1_000_000,
        searchText,
        sort,
    });

    const rows = result?.renewals || [];
    if (!rows.length) {
        return next(new ErrorResponse('No data is available for export', 409));
    }

    const data = reshapeRenewalsForExport(rows);
    const buffer = await renderReportToPdfBuffer(data, 'Global Business Setup - Renewals Report');
    return res.status(200).json({
        status: true,
        message: 'Renewals PDF generated successfully.',
        responseCode: '000',
        data: { buffer, fileType: 'application/pdf' },
    });
});

// ─── Internal helper for activity bulk template service ──────────────────────

exports.fetchAllPlansData = async (key = accessKey) => {
    const serviceDetails = await findOneServiceOperator({ accessKey: key });
    if (!serviceDetails || serviceDetails.error) {
        throw new Error('Service is unavailable');
    }
    const apiUrl = serviceDetails.vendor.apiUrl + '/api/v1/user/external/agent';
    const token = await generateToken();
    const url = `${apiUrl}/licences/find`;
    const response = await axios.get(url, {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    });
    return response?.data?.data || [];
};

// Silence unused-import lint on categoryName (kept for symmetry with AE controller).
void categoryName;
