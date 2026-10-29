const asyncHandler = require('../../middlewares/async');
const { findAllAndCount, create, update, toggleStatus, findOneById, findAllForExport, deleteById } = require('../../models/use-cases/legalTemplate');
const { generateExcelBufferAndType } = require('../../utils/generateExcelBufferAndType');
const { reportPdfTemplate } = require('../../utils/reportTemplate');
const { fetchHtmlFromDocx } = require('../../utils/legalDocumentHelper');
const puppeteer = require('puppeteer');
const fs = require('fs');

exports.findTemplateById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    try {
        const template = await findOneById(id);
        if (!template) {
            return res.status(404).json({ status: false, message: 'Template not found', data: {}, responseCode: '001' });
        }
        let html = null;
        if (template.documentUrl) {
            html = await fetchHtmlFromDocx(template.documentUrl);
        }
        return res.status(200).json({
            status: true,
            data: { data: { ...template, html } },
            message: 'Template fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message, data: {}, responseCode: '001' });
    }
});

exports.findAllTemplates = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const itemsPerPage = parseInt(req.query.itemsPerPage) || 10;
    const searchText = req.query.searchText || '';
    const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    const sortField = req.query.sortField || 'createdAt';
    const category = req.query.category || undefined;

    try {
        const isAdmin = req.user.role === 'SYSTEM_USER';
        const data = await findAllAndCount({ page, itemsPerPage, searchText, sort, sortField, onlyActive: !isAdmin, category, logTraceId: req?.LogTraceId });
        return res.status(200).json({
            status: true,
            data: { recordsTotal: data.count, data: data.rows },
            message: 'Templates fetched successfully',
            responseCode: '000',
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message, data: {}, responseCode: '001' });
    }
});

exports.createTemplate = asyncHandler(async (req, res) => {
    const { title, category, description, timeEstimate, iconKey, documentBase, documentFormat } = req.body;

    if (!documentBase || !documentFormat) {
        return res.status(400).json({ status: false, message: 'Document file is required', data: {}, responseCode: '001' });
    }

    try {
        const existing = await findAllAndCount({ page: 1, itemsPerPage: 1, searchText: title, sort: 'DESC', sortField: 'createdAt' });
        if (existing.rows.find((t) => t.title.toLowerCase() === title.toLowerCase())) {
            return res.status(400).json({ status: false, message: 'Template with this title already exists', data: {}, responseCode: '001' });
        }

        const template = await create({ title, category, description, timeEstimate, iconKey, documentBase, documentFormat });
        return res.status(201).json({
            status: true,
            message: 'Template created successfully',
            data: template,
            responseCode: '000',
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message, data: {}, responseCode: '001' });
    }
});

exports.updateTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, category, description, timeEstimate, iconKey, documentBase, documentFormat } = req.body;

    try {
        const existing = await findOneById(id);
        if (!existing) {
            return res.status(404).json({ status: false, message: 'Template not found', data: {}, responseCode: '001' });
        }

        await update(id, { title, category, description, timeEstimate, iconKey, documentBase, documentFormat });
        return res.status(200).json({
            status: true,
            message: 'Template updated successfully',
            data: {},
            responseCode: '000',
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message, data: {}, responseCode: '001' });
    }
});

exports.toggleTemplateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const result = await toggleStatus(id);
        if (!result) {
            return res.status(404).json({ status: false, message: 'Template not found', data: {}, responseCode: '001' });
        }
        return res.status(200).json({
            status: true,
            message: 'Template status updated successfully',
            data: {},
            responseCode: '000',
        });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message, data: {}, responseCode: '001' });
    }
});

exports.deleteTemplate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    try {
        const result = await deleteById(id);
        if (!result) {
            return res.status(404).json({ status: false, message: 'Template not found', data: {}, responseCode: '001' });
        }
        return res.status(200).json({
            status: true,
            message: 'Template deleted successfully',
            data: {},
            responseCode: '000',
        });
    } catch (error) {
        if (error.name === 'SequelizeForeignKeyConstraintError' || (error.original && error.original.code === 'ER_ROW_IS_REFERENCED_2')) {
            return res.status(400).json({ status: false, message: 'This template cannot be deleted because it has existing documents. Please delete the documents first.', data: {}, responseCode: '001' });
        }
        return res.status(500).json({ status: false, message: error.message, data: {}, responseCode: '001' });
    }
});

exports.exportTemplates = asyncHandler(async (req, res) => {
    const { type } = req.params;
    const searchText = req.query.searchText || '';
    const sort = req.query.sort === 'ASC' ? 'ASC' : 'DESC';
    const sortField = req.query.sortField || 'createdAt';

    try {
        const data = await findAllForExport({ searchText, sort, sortField, logTraceId: req?.LogTraceId });

        if (!data || data.length < 1) {
            return res.status(500).json({ status: false, message: 'No data available for export', data: {}, responseCode: '001' });
        }

        if (type === 'pdf') {
            const html = reportPdfTemplate(data, { title: 'Legal Templates Report' });
            const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
            const page = await browser.newPage();
            await page.setContent(html, { waitUntil: 'domcontentloaded' });
            const random = new Date().valueOf();
            const outputFile = `report-${random}.pdf`;
            await page.pdf({ scale: 0.6, path: outputFile, format: 'A4', preferCSSPageSize: true });
            await browser.close();
            const buffer = fs.readFileSync(outputFile);
            fs.unlinkSync(outputFile);
            return res.status(200).json({ status: true, message: 'Report generated successfully.', data: { buffer, fileType: 'application/pdf' }, responseCode: '000' });
        }

        const { buffer, fileType } = await generateExcelBufferAndType(data, type === 'excel' ? 'excel' : 'csv');
        return res.status(200).json({ status: true, message: 'Fetched successfully', data: { buffer, fileType }, responseCode: '000' });
    } catch (error) {
        return res.status(500).json({ status: false, message: error.message, data: {}, responseCode: '001' });
    }
});
