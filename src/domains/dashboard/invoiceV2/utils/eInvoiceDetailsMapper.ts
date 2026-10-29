import { formatDateAndTime } from './helperFunctions';
import { EInvoiceDetailView, EInvoiceDetailsApiResponse } from '../types/eInvoiceDetails';

const TRANS_MODE_MAP: Record<string, string> = {
    '1': 'Road',
    '2': 'Rail',
    '3': 'Air',
    '4': 'Ship',
};

export const mapEInvoiceApiToView = (data: EInvoiceDetailsApiResponse): EInvoiceDetailView => {
    const useIgst =
        data.igstOnIntraState === '1' || data.sellerDetails.stateCode !== data.placeOfSupply;

    return {
        id: String(data.id),
        gstin: data.sellerGstin,
        status: data.status as 'ACTIVE' | 'CANCELLED',
        docType: data.docType,
        supplyType: data.supplyType,
        igstOnIntra: data.igstOnIntraState === '1',
        useIgst,
        dated: data.docDate,
        generated: formatDateAndTime(data.createdAt),
        irnHash: data.irn,
        irnAck: data.ackNo,
        ackDate: formatDateAndTime(data.ackDt),
        signedJws: data.signedInvoice,
        signedQRCode: data.signedQRCode || '',
        createdAt: data.createdAt,
        cancelledDate: data.cancelledDate,
        cancelReason: data.cancelReason,
        cancelRemark: data.cancelRemark,
        totalTaxable: data.totalTaxableValue,
        totalAmount: data.totalAmount,
        transaction: [
            { label: 'Supply Type', value: data.supplyType },
            { label: 'Doc Type', value: data.docType },
            { label: 'Doc Number', value: data.docNo },
            { label: 'Doc Date', value: data.docDate },
            { label: 'Reverse Charge', value: data.reverseCharge === '1' ? 'Yes' : 'No' },
            { label: 'IGST on Intra-State', value: data.igstOnIntraState === '1' ? 'Yes' : 'No' },
        ],
        seller: [
            { label: 'GSTIN', value: data.sellerDetails.gstin },
            { label: 'Legal Name', value: data.sellerDetails.legalName },
            { label: 'Trade Name', value: data.sellerDetails.tradeName || '—' },
            { label: 'Address', value: data.sellerDetails.addr1 },
            {
                label: 'Location',
                value: `${data.sellerDetails.location} - ${data.sellerDetails.pin}`,
            },
            { label: 'State', value: data.sellerDetails.stateCode },
        ],
        buyer: [
            { label: 'GSTIN', value: data.buyerDetails.gstin },
            { label: 'Legal Name', value: data.buyerDetails.legalName },
            { label: 'Trade Name', value: data.buyerDetails.tradeName || '—' },
            { label: 'Address', value: data.buyerDetails.addr1 },
            {
                label: 'Location',
                value: `${data.buyerDetails.location} - ${data.buyerDetails.pin}`,
            },
            { label: 'State', value: data.buyerDetails.stateCode },
            { label: 'Place of Supply', value: data.placeOfSupply },
        ],
        lineItems: data.lineItems.map((item, idx) => ({
            id: String(idx + 1),
            description: item.description,
            hsnSac: item.hsnCode,
            quantity: item.quantity,
            unit: item.unit,
            unitPrice: item.unitPrice,
            discount: item.discount,
            gstRate: item.gstRate,
            taxableAmount: item.taxableAmount,
            tax: useIgst ? item.igstAmount : item.cgstAmount + item.sgstAmount,
            itemTotal: item.itemTotal,
        })),
        eWaybill: data.eWaybill?.id
            ? {
                  id: String(data.eWaybill.id),
                  status: data.eWaybill.status,
                  ewbNumber: data.eWaybill.ewbNo,
                  generatedOn: formatDateAndTime(data.eWaybill.ewbDt),
                  transportMode: TRANS_MODE_MAP[data.eWaybill.transMode] ?? data.eWaybill.transMode,
                  vehicleNo: data.eWaybill.vehNo || '—',
                  transDocNo: data.eWaybill.transDocNo || '—',
                  distance: String(data.eWaybill.distance),
                  transporter: data.eWaybill.transName || '—',
                  createdAt: data.eWaybill.createdAt,
              }
            : null,
    };
};
