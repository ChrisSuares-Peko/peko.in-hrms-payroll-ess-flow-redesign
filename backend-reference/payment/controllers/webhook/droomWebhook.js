const { Op } = require('sequelize');

const asyncHandler = require('../../middlewares/async');
const { customLog } = require('../../utils/loggerHelper');
const order = require('../../models/entities/order');
const serviceOperator = require('../../models/entities/serviceOperator');
const operatorsData = require('../../utils/operatorsData.json');

const accessKey = operatorsData.challan.accessKey;

// Map Droom's order-status string to our internal code (keys of ORDER_STATUS_LABELS in challan.js).
const mapDroomStatus = status => {
    const s = String(status || '').trim().toLowerCase();
    if (s.includes('partially resolved')) return 'CHALLAN_PARTIALLY_RESOLVED';
    if (s.includes('resolved')) return 'CHALLAN_COMPLETELY_RESOLVED';
    if (s.includes('partially refunded')) return 'PARTIAL_REFUND';
    if (s.includes('refunded') || s === 'refund') return 'REFUND';
    if (s === 'assigned' || s === 'payment complete') return 'SUCCESS';
    if (s.includes('fail')) return 'FAILURE';
    return null; // pre-assigned / unknown → no terminal change
};

// POST /api/v1/webhook/droom/payment/challan-status — Droom order-status callback.
// Payload: { registration_number, Challan_number, order_date, status, amount, customer_name }.
// No reference_id, so match the order by Challan_number (persisted at payment) + reg number.
// Status sync only — refunds do NOT move money here yet (Phase 2). Always ACK 200.
exports.droomChallanStatusWebhook = asyncHandler(async (req, res) => {
    const body = req.body || {};
    customLog(
        req?.LogTraceId,
        'info',
        {
            message: 'Droom challan status callback received',
            method: req.method,
            url: req.originalUrl,
            body: JSON.stringify(body),
        },
        'VENDOR'
    );

    // Field names vary in the doc — accept the documented casing and common variants.
    const challanNumber = (body.Challan_number || body.challan_number || '').toString().trim();
    const registrationNumber = (body.registration_number || body.registrationNumber || '')
        .toString()
        .trim();
    const mappedStatus = mapDroomStatus(body.status);

    if (!challanNumber || !mappedStatus) {
        customLog(
            req?.LogTraceId,
            'info',
            { message: 'Droom callback ignored (missing challan number or unmapped status)', challanNumber, droomStatus: body.status },
            'VENDOR'
        );
        return res.status(200).json({ status: true, message: 'received' });
    }

    try {
        // Find our challan order holding this challan number (seeded into orderResponse at payment).
        const where = { orderResponse: { [Op.like]: `%${challanNumber}%` } };
        if (registrationNumber) where.accountNo = registrationNumber;
        const orderRow = await order.findOne({
            where,
            include: [{ model: serviceOperator, attributes: [], where: { accessKey } }],
            order: [['transactionDate', 'DESC']],
        });

        if (!orderRow) {
            customLog(
                req?.LogTraceId,
                'info',
                { message: 'Droom callback: no matching challan order found', challanNumber, registrationNumber, mappedStatus },
                'VENDOR'
            );
            return res.status(200).json({ status: true, message: 'received' });
        }

        // Idempotent: Droom may retry — skip if the order is already in this state.
        if (orderRow.status === mappedStatus) {
            return res.status(200).json({ status: true, message: 'received' });
        }

        // Record the per-challan status in orderResponse for traceability.
        let parsed = {};
        try {
            parsed = JSON.parse(orderRow.orderResponse || '{}');
        } catch (e) {
            parsed = { response: orderRow.orderResponse };
        }
        parsed.challanStatuses = { ...(parsed.challanStatuses || {}), [challanNumber]: body.status };

        await orderRow.update({ status: mappedStatus, orderResponse: JSON.stringify(parsed) });

        customLog(
            req?.LogTraceId,
            'info',
            {
                message: 'Droom callback applied',
                corporateTxnId: orderRow.corporateTxnId,
                challanNumber,
                droomStatus: body.status,
                mappedStatus,
            },
            'VENDOR'
        );
        // Phase 2: on PARTIAL_REFUND / REFUND, credit the wallet for body.amount (deferred).
    } catch (error) {
        customLog(
            req?.LogTraceId,
            'error',
            { message: 'Droom callback handling failed', challanNumber, error: error.message },
            'VENDOR'
        );
    }

    return res.status(200).json({ status: true, message: 'received' });
});
