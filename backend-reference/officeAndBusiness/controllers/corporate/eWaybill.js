/* eslint-disable no-unused-vars */
const asyncHandler = require('../../middlewares/async');
const ErrorResponse = require('../../utils/error-response');
const { generateEwaybillService, cancelEwaybillService } = require('../../services/eInvoice');
const { getEInvoiceById, updateEInvoice } = require('../../models/use-cases/eInvoices');
const { createEWaybill, getEWaybillById, updateEWaybill } = require('../../models/use-cases/eWaybill');
const { customLog } = require('../../utils/loggerHelper');

const CANCEL_REASON_CODE_MAP = {
    'Duplicate': '1',
    'Data Entry Mistake': '2',
};

const TRANS_MODE_MAP = {
    road: '1',
    rail: '2',
    air: '3',
    ship: '4',
};

const VEH_TYPE_MAP = {
    regular: 'R',
    odc: 'O',
};

exports.generateEwaybill = asyncHandler(async (req, res, next) => {
    try {
        const { authToken, sek, gstin, username } = req.eInvoiceAuth;
        const corporateUserId = req.user.corporateId;
        const { id } = req.params;
        const { distance, transMode, transId, transName, vehNo, vehType, transDocNo, transDocDt } = req.body;

        const eInvoiceRecord = await getEInvoiceById(id, corporateUserId);
        if (!eInvoiceRecord) return next(new ErrorResponse('E-invoice not found', 404));
        if (eInvoiceRecord.status === 'CANCELLED') return next(new ErrorResponse('Cannot generate e-Waybill for a cancelled eInvoice', 400));
        if (eInvoiceRecord.eWaybillId) return next(new ErrorResponse('E-Waybill already generated for this eInvoice', 400));

        const mappedTransMode = TRANS_MODE_MAP[transMode] || transMode;
        const isRoadMode = mappedTransMode === '1';
        const mappedVehType = isRoadMode ? (VEH_TYPE_MAP[vehType] || vehType || 'R') : null;

        const result = await generateEwaybillService(gstin, username, authToken, sek, eInvoiceRecord.irn, {
            distance,
            transMode: mappedTransMode,
            transId,
            transName,
            vehNo: isRoadMode ? vehNo : null,
            vehType: mappedVehType,
            transDocNo: !isRoadMode ? transDocNo : null,
            transDocDt: !isRoadMode ? transDocDt : null,
        });

        const waybillRecord = await createEWaybill({
            ewbNo: result.EwbNo,
            ewbDt: result.EwbDt,
            ewbValidTill: result.EwbValidTill,
            distance,
            transMode: mappedTransMode,
            transId: transId || null,
            transName: transName || null,
            vehNo: isRoadMode ? (vehNo || null) : null,
            vehType: mappedVehType,
            transDocNo: !isRoadMode ? (transDocNo || null) : null,
            transDocDt: !isRoadMode ? (transDocDt || null) : null,
            corporateUserId,
            subCorporateUserId: req.user.role === 'CORPORATE_SUB_USER' ? req.user.subCorporateId : null,
        });

        await updateEInvoice(id, { eWaybillId: waybillRecord.id });

        return res.status(200).json({
            status: true,
            data: {
                id: waybillRecord.id,
                ewbNo: result.EwbNo,
                ewbDt: result.EwbDt,
                ewbValidTill: result.EwbValidTill,
            },
            message: 'E-Waybill generated successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});

exports.cancelEwaybill = asyncHandler(async (req, res, next) => {
    try {
        const { authToken, sek, gstin, username } = req.eInvoiceAuth;
        const { id } = req.params;
        const { cancelReason } = req.body;

        if (!cancelReason) return next(new ErrorResponse('cancelReason is required', 400));

        const waybillRecord = await getEWaybillById(id);
        if (!waybillRecord) return next(new ErrorResponse('E-Waybill not found', 404));
        if (waybillRecord.status === 'CANCELLED') return next(new ErrorResponse('E-Waybill is already cancelled', 400));

        const cancelRsnCode = CANCEL_REASON_CODE_MAP[cancelReason];
        if (!cancelRsnCode) return next(new ErrorResponse('Invalid cancelReason', 400));

        await cancelEwaybillService(gstin, username, authToken, sek, waybillRecord.ewbNo, cancelRsnCode);

        await updateEWaybill(id, {
            status: 'CANCELLED',
            cancelledDate: new Date().toISOString(),
            cancelReason,
        });

        return res.status(200).json({
            status: true,
            data: {},
            message: 'E-Waybill cancelled successfully',
            responseCode: '000',
        });
    } catch (error) {
        customLog(req?.LogTraceId, 'error', { error: error.message });
        return next(new ErrorResponse(error.message || 'Something went wrong', 500));
    }
});
