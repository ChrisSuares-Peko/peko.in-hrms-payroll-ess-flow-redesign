'use strict';

const ErrorResponse = require('../../utils/error-response');
const { customLog } = require('../../utils/loggerHelper');
const { getAgingReport } = require('../../models/use-cases/agingAnalysis');

exports.fetchAgingAnalysis = async (req, res, next) => {
    try {
        const {
            timePeriod = 'all',
            page = 1,
            limit = 10,
            sortBy,
            sortOrder = 'desc',
        } = req.query;

        const corporateUserId = req.user.corporateId;
        const subCorporateUserId =
            req.user.role === 'CORPORATE_SUB_USER' && req.user.subCorporateId
                ? req.user.subCorporateId
                : undefined;

        const { summaryRaw, bucketsRaw, listResult, safeLimit, safePage } = await getAgingReport(
            corporateUserId,
            { timePeriod, page, limit, sortBy, sortOrder },
            subCorporateUserId
        );

        const calcPercent = (current, prev) => {
            const c = parseFloat(current) || 0;
            const p = parseFloat(prev) || 0;
            if (p === 0) return c > 0 ? 99 : 0;
            const pct = ((c - p) / p) * 100;
            return parseFloat(Math.max(-99, Math.min(99, pct)).toFixed(2));
        };

        const summary = {
            outstanding: {
                amount: parseFloat(summaryRaw.outstandingTotal) || 0,
                changePercentage: calcPercent(summaryRaw.outstandingThisMonth, summaryRaw.outstandingLastMonth),
            },
            overdue: {
                amount: parseFloat(summaryRaw.overdueTotal) || 0,
                changePercentage: calcPercent(summaryRaw.overdueThisMonth, summaryRaw.overdueLastMonth),
            },
            paid: {
                amount: parseFloat(summaryRaw.paidThisMonth) || 0,
                changePercentage: calcPercent(summaryRaw.paidThisMonth, summaryRaw.paidLastMonth),
            },
            avgDaysToPay: Math.round(parseFloat(summaryRaw.avgDaysToPay) || 0),
        };

        const agingAnalysis = {
            buckets: [
                { label: 'current',   count: parseInt(bucketsRaw.currentCount) || 0,       amount: parseFloat(bucketsRaw.currentAmount) || 0 },
                { label: '1_to_30',   count: parseInt(bucketsRaw.bucket1to30Count) || 0,   amount: parseFloat(bucketsRaw.bucket1to30Amount) || 0 },
                { label: '31_to_60',  count: parseInt(bucketsRaw.bucket31to60Count) || 0,  amount: parseFloat(bucketsRaw.bucket31to60Amount) || 0 },
                { label: '61_to_90',  count: parseInt(bucketsRaw.bucket61to90Count) || 0,  amount: parseFloat(bucketsRaw.bucket61to90Amount) || 0 },
                { label: 'above_90',  count: parseInt(bucketsRaw.bucketAbove90Count) || 0, amount: parseFloat(bucketsRaw.bucketAbove90Amount) || 0 },
            ],
            totalOutstanding: parseFloat(bucketsRaw.totalOutstanding) || 0,
            totalPaid: parseFloat(bucketsRaw.totalPaid) || 0,
        };

        const totalRecords = listResult.count;
        const totalPages = Math.ceil(totalRecords / safeLimit);

        return res.status(200).json({
            status: true,
            message: 'Aging report fetched successfully',
            data: {
                filters: { timePeriod, sortBy: sortBy || 'createdAt', sortOrder, page: safePage, limit: safeLimit },
                summary,
                agingAnalysis,
                invoices: listResult.rows,
                pagination: { page: safePage, limit: safeLimit, totalRecords, totalPages },
            },
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { message: error?.message });
        return next(new ErrorResponse(error.message, 500));
    }
};
