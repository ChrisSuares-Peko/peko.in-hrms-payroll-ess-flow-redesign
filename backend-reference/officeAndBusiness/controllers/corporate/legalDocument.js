'use strict';

const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { create, findAll, findById, updateById } = require('../../models/use-cases/legalDocument');
const { generatePdf } = require('../../utils/legalDocumentHelper');
const { uploadPdfBuffer } = require('../../utils/commonUploadFile');
const { fetchServiceDetails } = require('../../utils/checkAndFetchServiceDetails');
const operatorsData = require('../../utils/operatorsData.json');
const axios = require('axios');

exports.createDocument = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await fetchServiceDetails({
            credentialId: req.user.id,
            corporateUserId: req.user.corporateId,
            packageId: req.user.packageId,
            accessKey: operatorsData.legalService.accessKey,
        });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(serviceDetails.error, 402));
        }

        const corporateUserId = req.user.corporateId;
        const subCorporateUserId = req.user.subCorporateId || null;
        const { title, editorHtml: rawHtml } = req.body;
        const editorHtml = rawHtml ? rawHtml.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '') : null;

        const document = await create({
            corporateUserId,
            subCorporateUserId,
            title,
            editorHtml,
            status: 'DRAFT',
        });

        let documentUrl = null;
        try {
            const pdfBuffer = await generatePdf(null, editorHtml);
            documentUrl = await uploadPdfBuffer(pdfBuffer, `legalDocuments/${document.id}`);
            await updateById(document.id, { documentUrl });
        } catch (pdfErr) {
            customLog(req?.LogTraceId, 'error', { message: `PDF upload failed: ${pdfErr?.message}` });
        }

        return res.status(201).json({
            status: true,
            data: { ...document.dataValues, documentUrl },
            message: 'Document saved successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getDocuments = asyncHandler(async (req, res, next) => {
    try {
        const { searchText, status } = req.query;
        const corporateUserId = req.user.corporateId;
        const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
        const page = req.query.page ? parseInt(req.query.page, 10) : 1;
        const offset = (page - 1) * (limit || 0);

        const params = {
            corporateUserId,
            searchText,
            status: status && status !== 'All' ? status.toUpperCase() : null,
            limit,
            offset: limit ? offset : undefined,
        };

        if (req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId) {
            params.subCorporateUserId = req.user.subCorporateId;
        }

        const result = await findAll({ ...params, logTraceId: req?.LogTraceId });

        return res.status(200).json({
            status: true,
            data: { data: result.rows, count: result.count },
            message: 'Documents fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.getDocumentById = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;
        const document = await findById(id, req.user.corporateId);

        if (!document) {
            return res.status(404).json({ status: false, message: 'Document not found', responseCode: '404' });
        }

        return res.status(200).json({
            status: true,
            data: document,
            message: 'Document fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});


exports.updateDocument = asyncHandler(async (req, res, next) => {
    try {
        const serviceDetails = await fetchServiceDetails({
            credentialId: req.user.id,
            corporateUserId: req.user.corporateId,
            packageId: req.user.packageId,
            accessKey: operatorsData.legalService.accessKey,
        });
        if (Object.prototype.hasOwnProperty.call(serviceDetails, 'error')) {
            return next(new ErrorResponse(serviceDetails.error, 402));
        }

        const { id } = req.params;
        const corporateUserId = req.user.corporateId;
        const { editorHtml: rawUpdateHtml } = req.body;
        const editorHtml = rawUpdateHtml ? rawUpdateHtml.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '') : null;

        const document = await findById(id, corporateUserId);
        if (!document) {
            return res.status(404).json({ status: false, message: 'Document not found', responseCode: '404' });
        }
        if (String(document.corporateUserId) !== String(corporateUserId)) {
            return res.status(403).json({ status: false, message: 'Unauthorized', responseCode: '403' });
        }
        if (document.status === 'SIGNED' || document.status === 'SENT') {
            return res.status(400).json({ status: false, message: 'Only draft documents can be edited', responseCode: '400' });
        }

        await updateById(id, { editorHtml }, corporateUserId);

        let documentUrl = document.documentUrl;
        try {
            const pdfBuffer = await generatePdf(null, editorHtml);
            documentUrl = await uploadPdfBuffer(pdfBuffer, `legalDocuments/${id}`);
            await updateById(id, { documentUrl }, corporateUserId);
        } catch (pdfErr) {
            customLog(req?.LogTraceId, 'error', { message: `PDF update failed: ${pdfErr?.message}` });
        }

        return res.status(200).json({
            status: true,
            data: { id, documentUrl },
            message: 'Document updated successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});

exports.downloadDocument = asyncHandler(async (req, res, next) => {
    try {
        const { id } = req.params;

        const document = await findById(id, req.user.corporateId);
        if (!document) {
            return res.status(404).json({ status: false, message: 'Document not found', data: {}, responseCode: '404' });
        }
        if (!document.documentUrl) {
            return res.status(404).json({ status: false, message: 'Document PDF not available', data: {}, responseCode: '404' });
        }

        const axiosResponse = await axios.get(document.documentUrl, { responseType: 'arraybuffer' });
        const pdfBuffer = Buffer.from(axiosResponse.data);

        return res.status(200).json({
            status: true,
            message: 'PDF downloaded successfully.',
            data: { pdfBuffer },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        next(new ErrorResponse(error.message, 500));
    }
});
