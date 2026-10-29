'use strict';

const { Op } = require('sequelize');
const invoicingV2 = require('../entities/invoicingV2');
const { customLog } = require('../../utils/loggerHelper');

const OUTSTANDING_STATUSES = ['PENDING', 'OVERDUE', 'PARTIAL'];
const CURRENT_BUCKET_STATUSES = ['PENDING', 'PARTIAL'];

const isInMonth = (dateVal, year, month) => {
    if (!dateVal) return false;
    const d = new Date(dateVal);
    return !isNaN(d) && d.getFullYear() === year && d.getMonth() === month;
};

const atMidnight = (dateVal) => {
    const d = new Date(dateVal);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
};

const daysBetween = (a, b) => Math.floor((a - b) / (1000 * 60 * 60 * 24));

// Everything here is fetched as plain rows and computed in JS — no raw SQL joins/subqueries
// against `invoicings` referencing itself. A correlated-subquery version of this (netting out
// linked credit notes inline in SQL) produced wrong results across the board, the same class of
// self-reference problem the main dashboard hit before switching to this fetch-then-compute
// approach.
exports.getAgingReport = async (corporateUserId, params, subCorporateUserId) => {
    try {
        const { timePeriod = 'all', page = 1, limit = 10, sortBy, sortOrder = 'desc' } = params;

        const safeLimit = Math.min(parseInt(limit) || 10, 100);
        const safePage  = Math.max(parseInt(page) || 1, 1);

        const baseWhere = { corporateUserId, documentType: 'INVOICE' };
        if (subCorporateUserId) baseWhere.subCorporateUserId = subCorporateUserId;

        const invoices = await invoicingV2.findAll({
            where: baseWhere,
            attributes: [
                'id', 'invoiceNumber', 'prefix', 'name', 'cashSale', 'invoiceDate', 'dueDate',
                'totalAmount', 'amountPaid', 'amountDue', 'currency', 'status',
                'createdAt', 'updatedAt', 'paymentDate',
            ],
            raw: true,
        });

        const invoiceIds = invoices.map(inv => inv.id);
        const creditNotes = invoiceIds.length
            ? await invoicingV2.findAll({
                where: { corporateUserId, documentType: 'CREDIT_NOTE', linkedInvoiceId: { [Op.in]: invoiceIds } },
                attributes: ['linkedInvoiceId', 'totalAmount'],
                raw: true,
            })
            : [];

        const creditTotalByInvoiceId = {};
        creditNotes.forEach(cn => {
            creditTotalByInvoiceId[cn.linkedInvoiceId] =
                (creditTotalByInvoiceId[cn.linkedInvoiceId] || 0) + (parseFloat(cn.totalAmount) || 0);
        });

        const now = new Date();
        const today = atMidnight(now);
        const thisYear = now.getFullYear();
        const thisMonth = now.getMonth();
        const lastMonthDate = new Date(thisYear, thisMonth - 1, 1);
        const lastYear = lastMonthDate.getFullYear();
        const lastMonth = lastMonthDate.getMonth();

        let outstandingTotal = 0, outstandingThisMonth = 0, outstandingLastMonth = 0;
        let overdueTotal = 0, overdueThisMonth = 0, overdueLastMonth = 0;
        let paidThisMonth = 0, paidLastMonth = 0;
        let paidDaysSum = 0, paidCount = 0;
        let totalPaid = 0;

        const bucketTotals = {
            current:   { count: 0, amount: 0 },
            '1_to_30': { count: 0, amount: 0 },
            '31_to_60': { count: 0, amount: 0 },
            '61_to_90': { count: 0, amount: 0 },
            above_90:  { count: 0, amount: 0 },
        };

        const enriched = invoices.map(inv => {
            const total = parseFloat(inv.totalAmount) || 0;
            const paid = parseFloat(inv.amountPaid) || 0;
            const credited = creditTotalByInvoiceId[inv.id] || 0;
            const outstanding = Math.max(0, total - credited - paid);

            const daysOverdue = inv.dueDate ? Math.max(0, daysBetween(today, atMidnight(inv.dueDate))) : 0;
            const isOutstandingStatus = OUTSTANDING_STATUSES.includes(inv.status);
            const isCurrentBucketStatus = CURRENT_BUCKET_STATUSES.includes(inv.status);

            let bucket = null;
            if (isCurrentBucketStatus && (!inv.dueDate || daysOverdue <= 0)) {
                bucket = 'current';
            } else if (isOutstandingStatus && daysOverdue >= 1 && daysOverdue <= 30) {
                bucket = '1_to_30';
            } else if (isOutstandingStatus && daysOverdue >= 31 && daysOverdue <= 60) {
                bucket = '31_to_60';
            } else if (isOutstandingStatus && daysOverdue >= 61 && daysOverdue <= 90) {
                bucket = '61_to_90';
            } else if (isOutstandingStatus && daysOverdue >= 91) {
                bucket = 'above_90';
            }

            if (bucket) {
                bucketTotals[bucket].count += 1;
                bucketTotals[bucket].amount += outstanding;
            }

            if (isOutstandingStatus) {
                outstandingTotal += outstanding;
                if (isInMonth(inv.createdAt, thisYear, thisMonth)) outstandingThisMonth += outstanding;
                if (isInMonth(inv.createdAt, lastYear, lastMonth)) outstandingLastMonth += outstanding;

                if (daysOverdue > 0) {
                    overdueTotal += outstanding;
                    if (isInMonth(inv.createdAt, thisYear, thisMonth)) overdueThisMonth += outstanding;
                    if (isInMonth(inv.createdAt, lastYear, lastMonth)) overdueLastMonth += outstanding;
                }
            }

            if (inv.status === 'PAID') {
                totalPaid += paid;
                const dateRef = inv.paymentDate || inv.updatedAt;
                if (isInMonth(dateRef, thisYear, thisMonth)) paidThisMonth += paid;
                if (isInMonth(dateRef, lastYear, lastMonth)) paidLastMonth += paid;

                if (inv.paymentDate && inv.invoiceDate) {
                    const diff = daysBetween(new Date(inv.paymentDate), new Date(inv.invoiceDate));
                    if (Number.isFinite(diff)) {
                        paidDaysSum += diff;
                        paidCount += 1;
                    }
                }
            }

            return {
                id: inv.id,
                invoiceNumber: inv.invoiceNumber,
                prefix: inv.prefix,
                name: inv.name || (inv.cashSale ? 'Cash Sale' : 'N/A'),
                invoiceDate: inv.invoiceDate,
                dueDate: inv.dueDate,
                totalAmount: inv.totalAmount,
                amountPaid: inv.amountPaid,
                amountDue: inv.amountDue,
                currency: inv.currency,
                status: inv.status,
                createdAt: inv.createdAt,
                daysOverdue,
                outstandingAmount: outstanding.toFixed(2),
                _bucket: bucket,
            };
        });

        const summaryRaw = {
            outstandingTotal: outstandingTotal.toFixed(2),
            outstandingThisMonth: outstandingThisMonth.toFixed(2),
            outstandingLastMonth: outstandingLastMonth.toFixed(2),
            overdueTotal: overdueTotal.toFixed(2),
            overdueThisMonth: overdueThisMonth.toFixed(2),
            overdueLastMonth: overdueLastMonth.toFixed(2),
            paidThisMonth: paidThisMonth.toFixed(2),
            paidLastMonth: paidLastMonth.toFixed(2),
            avgDaysToPay: paidCount > 0 ? (paidDaysSum / paidCount).toFixed(2) : '0',
        };

        const bucketsRaw = {
            currentCount: bucketTotals.current.count,
            currentAmount: bucketTotals.current.amount.toFixed(2),
            bucket1to30Count: bucketTotals['1_to_30'].count,
            bucket1to30Amount: bucketTotals['1_to_30'].amount.toFixed(2),
            bucket31to60Count: bucketTotals['31_to_60'].count,
            bucket31to60Amount: bucketTotals['31_to_60'].amount.toFixed(2),
            bucket61to90Count: bucketTotals['61_to_90'].count,
            bucket61to90Amount: bucketTotals['61_to_90'].amount.toFixed(2),
            bucketAbove90Count: bucketTotals.above_90.count,
            bucketAbove90Amount: bucketTotals.above_90.amount.toFixed(2),
            totalOutstanding: outstandingTotal.toFixed(2),
            totalPaid: totalPaid.toFixed(2),
        };

        // ── Filter (timePeriod) + sort + paginate the invoice list ──────────────
        const filtered = (timePeriod !== 'all' && bucketTotals[timePeriod])
            ? enriched.filter(inv => inv._bucket === timePeriod)
            : enriched;

        const sortKeyFns = {
            outstanding: inv => parseFloat(inv.outstandingAmount) || 0,
            daysOverdue: inv => inv.daysOverdue,
        };
        const sortKeyFn = sortKeyFns[sortBy] || (inv => new Date(inv.createdAt).getTime());
        const orderMultiplier = sortOrder === 'asc' ? 1 : -1;

        const sorted = [...filtered].sort((a, b) => (sortKeyFn(a) - sortKeyFn(b)) * orderMultiplier);

        const offset = (safePage - 1) * safeLimit;
        const rows = sorted.slice(offset, offset + safeLimit).map(({ _bucket, ...rest }) => rest); // eslint-disable-line no-unused-vars

        return {
            summaryRaw,
            bucketsRaw,
            listResult: { count: filtered.length, rows },
            safeLimit,
            safePage,
        };
    } catch (error) {
        customLog(null, 'error', { message: 'Database error while fetching aging report', error: error.message });
        throw new Error('Database error while fetching aging report');
    }
};
