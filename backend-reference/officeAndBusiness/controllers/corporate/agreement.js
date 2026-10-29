const { createAgreement, findAgreement, findAgreementById, findAllAgreementsAndCount, updateAgreement, deleteAgreement, pushAgreementTimeline } = require("../../models/use-cases/agreement");
const { findSettings: findInvoiceSettings } = require("../../models/use-cases/invoiceSettingsV2");
const { agreementTemplate } = require("../../utils/agreementTemplate");
const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const fs = require("fs");
const https = require("https");
const puppeteer = require("puppeteer");
const { uploadFile } = require("../../utils/commonUploadFile");



// GET /agreement/:id
exports.getAgreementById = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const corporateUserId = req.user.corporateId;

        const result = await findAgreementById(id, corporateUserId);

        if (!result) {
            return next(new ErrorResponse("Agreement not found", 404));
        }

        return res.status(200).json({
            status: true,
            message: "Agreement fetched successfully",
            data: result,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /agreement/all
exports.getAllAgreements = asyncHandler(async (req, res, next) => {
    try {
        let { from, to, searchText, page, itemsPerPage, status, sortField, customerId } = req.query;
        const userId = req.user.corporateId;
        const sort = req.query.sort && req.query.sort === "ASC" ? "ASC" : "DESC";

        page = page ? parseInt(page) : 1;
        itemsPerPage = itemsPerPage ? parseInt(itemsPerPage) : null;
        const limit = itemsPerPage;
        const offset = page && itemsPerPage ? (page - 1) * itemsPerPage : undefined;

        const params = {
            from,
            to,
            limit,
            offset,
            searchText,
            sort,
            sortField: sortField || "id",
            userId,
            status: status ? status.split(",").map(s => s.trim().toUpperCase()) : null,
            customerId: customerId ? parseInt(customerId) : null,
        };

        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }

        const result = await findAllAgreementsAndCount(params);

        return res.status(200).json({
            status: true,
            message: "Agreements fetched successfully",
            data: {
                agreements: result.rows,
                recordsTotal: result.recordsTotal,
                statusCounts: result.statusCounts,
            },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// PUT /agreement/:id
exports.editAgreement = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id } = req.params;

        const existing = await findAgreement({ id, corporateUserId });

        if (!existing) {
            return next(new ErrorResponse("Agreement not found", 404));
        }

        // Check agreement number uniqueness (exclude current)
        if (req.body.agreementNumber && req.body.agreementNumber !== existing.agreementNumber) {
            const duplicate = await findAgreement({ agreementNumber: req.body.agreementNumber, corporateUserId });
            if (duplicate) {
                return next(new ErrorResponse("Agreement number already exists", 400));
            }
        }

        if (req.body.endDate && new Date(req.body.endDate) < new Date(req.body.startDate || existing.startDate)) {
            return next(new ErrorResponse("End date cannot be before start date", 400));
        }

        // Exclude id from update to prevent primary key modification
        const { id: _id, ...updateData } = req.body; // eslint-disable-line no-unused-vars

        const updated = await updateAgreement({ id, corporateUserId }, updateData);

        if (!updated) {
            return next(new ErrorResponse("Something went wrong while updating agreement", 500));
        }

        customLog(req?.LogTraceId, "info", { message: "Agreement updated", id });

        return res.status(200).json({
            status: true,
            message: "Agreement updated successfully",
            data: {},
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /agreement/downloadAgreement/:agreementId
exports.downloadAgreement = asyncHandler(async (req, res) => {
    try {
        const id = req.params.agreementId;
        const corporateUserId = req.user.corporateId;

        if (!id) {
            return res.status(400).json({
                status: false,
                message: "Agreement ID not provided",
                data: {},
                responseCode: "001",
            });
        }

        const result = await findAgreementById(id, corporateUserId);

        if (!result) {
            return res.status(404).json({
                status: false,
                message: "Agreement not found",
                data: {},
                responseCode: "001",
            });
        }

        // Fetch biller settings — fall back to corporateUser if not set
        const settings = await findInvoiceSettings(corporateUserId);
        const cu = result.corporateUser || {};

        const biller = {
            name:         settings?.businessName  || cu.name      || '',
            address:      settings?.address       || '',
            city:         settings?.city          || cu.city      || '',
            state:        settings?.state         || cu.state     || '',
            pincode:      settings?.pincode       || '',
            phoneNumber:  settings?.phoneNumber   || cu.mobileNo  || '',
            email:        settings?.email         || cu.email     || '',
            gstNumber:    settings?.gstNo         || cu.gstNumber || '',
            logo:         settings?.logoUrl       || cu.logo      || null,
            signatureUrl: settings?.signatureUrl  || null,
        };

        const htmlContent = agreementTemplate(result, biller);
        const random = new Date().valueOf();

        const browser = await puppeteer.launch({
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
            headless: "new",
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent);

        const outputFile = `Agreement-${random}.pdf`;
        await page.pdf({
            path: outputFile,
            format: "A4",
            preferCSSPageSize: true,
        });

        customLog(req?.LogTraceId, "info", { message: "Agreement PDF generated successfully!" });

        const pdfBuffer = fs.readFileSync(outputFile);
        browser.close();
        fs.unlinkSync(outputFile);

        return res.status(200).json({
            status: true,
            message: "Agreement PDF generated successfully.",
            data: { pdfBuffer },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
        return res.status(500).json({
            status: false,
            message: "Error generating agreement PDF",
            data: {},
            responseCode: "001",
        });
    }
});

// POST /agreement
exports.createAgreement = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;

        const data = {
            ...req.body,
            corporateUserId,
            status: "DRAFT",
        };

        if (req.user.role === "CORPORATE_SUB_USER" && req.user.subCorporateId) {
            data.subCorporateUserId = req.user.subCorporateId;
        }

        // Resolve prefix and agreement number from settings if not supplied
        if (!data.prefix || !data.agreementNumber) {
            const settings = await findInvoiceSettings(corporateUserId);
            const prefixEntry = (settings?.documentNumberPrefix || []).find(
                (p) => p.type === "AGREEMENT"
            );

            if (!data.prefix) {
                data.prefix = prefixEntry?.prefix || "AGR";
            }

            if (!data.agreementNumber) {
                const now = new Date();
                const pad = (n, len = 2) => String(n).padStart(len, "0");
                data.agreementNumber = `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}${pad(now.getMilliseconds(), 3)}`;
            }
        }

        // Prevent duplicate agreement number (prefix + number) for same corporate user
        const existing = await findAgreement({
            prefix: data.prefix,
            agreementNumber: data.agreementNumber,
            corporateUserId,
        });

        if (existing) {
            return next(new ErrorResponse("Agreement number already exists", 400));
        }

        if (data.endDate && new Date(data.endDate) < new Date(data.startDate)) {
            return next(new ErrorResponse("End date cannot be before start date", 400));
        }

        const result = await createAgreement(data);

        if (!result) {
            return next(new ErrorResponse("Something went wrong while creating agreement", 500));
        }

        await pushAgreementTimeline(result.id, "Agreement created");
        customLog(req?.LogTraceId, "info", { message: "Agreement created", id: result.id });

        return res.status(200).json({
            status: true,
            message: "Agreement created successfully",
            data: result,
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// DELETE /agreement/:id
exports.deleteAgreement = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const corporateUserId = req.user.corporateId;

        const result = await deleteAgreement(id, corporateUserId);

        if (!result) {
            return next(new ErrorResponse("Agreement not found", 404));
        }

        customLog(req?.LogTraceId, "info", { message: "Agreement deleted", id });

        return res.status(200).json({
            status: true,
            message: "Agreement deleted successfully",
            data: {},
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// POST /agreement/:id/uploadDocument
exports.uploadAgreementDocument = asyncHandler(async (req, res, next) => {
    try {
        const corporateUserId = req.user.corporateId;
        const { id } = req.params;
        const { documentBase64 } = req.body;

        if (!documentBase64) {
            return next(new ErrorResponse("documentBase64 is required", 400));
        }

        const existing = await findAgreement({ id, corporateUserId });
        if (!existing) {
            return next(new ErrorResponse("Agreement not found", 404));
        }

        const base64String = documentBase64.replace(/^data:application\/pdf;base64,/, '');
        const user = req.user;
        const filePath = `${user?.role ? user.role.toLowerCase() : "unknown-role"}/${user?.username ? user.username : "unknown-user"}/agreementDocs`;
        const documentUrl = await uploadFile(base64String, filePath, 'pdf');

        await updateAgreement({ id, corporateUserId }, { documentUrl, status: 'PENDING' });
        await pushAgreementTimeline(id, "Agreement uploaded");

        customLog(req?.LogTraceId, "info", { message: "Agreement document uploaded", id });

        return res.status(200).json({
            status: true,
            message: "Document uploaded successfully",
            data: { documentUrl },
            responseCode: "000",
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

// GET /agreement/:id/document
exports.getAgreementDocument = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const corporateUserId = req.user.corporateId;

        const agreement = await findAgreement({ id, corporateUserId });
        if (!agreement) {
            return next(new ErrorResponse("Agreement not found", 404));
        }
        if (!agreement.documentUrl) {
            return next(new ErrorResponse("No document uploaded for this agreement", 404));
        }

        customLog(req?.LogTraceId, "info", { message: "Proxying agreement document", id });

        const request = https.get(agreement.documentUrl, (upstream) => {
            if (upstream.statusCode !== 200) {
                return next(new ErrorResponse("Failed to retrieve document", 502));
            }
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader("Content-Disposition", `inline; filename="agreement-${id}.pdf"`);
            res.setHeader("Cache-Control", "private, max-age=3600");
            upstream.pipe(res);
        });

        request.on("error", (err) => {
            customLog(req?.LogTraceId, "error", { message: err.message });
            next(new ErrorResponse("Failed to retrieve document", 500));
        });
    } catch (error) {
        customLog(req?.LogTraceId, "error", { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});
