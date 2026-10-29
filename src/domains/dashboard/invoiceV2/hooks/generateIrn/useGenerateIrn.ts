import { useCallback, useState } from 'react';

import { useNavigate } from 'react-router-dom';

import { paths } from '@routes/paths';
import { useAppDispatch } from '@src/hooks/hooks';
import { useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { generateIrnApi } from '../../api/eInvoice';
import {
    GenerateIrnFormState,
    GenerateIrnLineItem,
    GenerateIrnPayload,
} from '../../types/generateIrn';
import { calcCgst, calcIgst, calcTaxable, r2, toNum } from '../../utils/generateIrnCalculations';

const buildPayload = (formState: GenerateIrnFormState): GenerateIrnPayload => {
    const { transaction: t, seller, buyer, items } = formState;
    const igst = t.igstOnIntra || (seller.state !== buyer.placeOfSupply);

    const lineItems: GenerateIrnLineItem[] = items.items.map(item => {
        const taxableAmount = calcTaxable(item);
        const igstAmount = calcIgst(item);
        const cgstAmount = calcCgst(item);
        const itemTotal = igst
            ? r2(taxableAmount + igstAmount)
            : r2(taxableAmount + cgstAmount * 2);
        return {
            description: item.description,
            hsnCode: item.hsnSac,
            quantity: toNum(item.quantity),
            unit: item.unit,
            unitPrice: r2(toNum(item.unitPrice)),
            discount: r2(toNum(item.discount)),
            taxableAmount,
            gstRate: item.gstRate,
            ...(igst ? { igstAmount } : { cgstAmount, sgstAmount: cgstAmount }),
            itemTotal,
        };
    });

    const totalTaxableValue = r2(lineItems.reduce((s, i) => s + i.taxableAmount, 0));
    const totalDiscount = r2(items.items.reduce((s, i) => s + toNum(i.discount), 0));
    const totalAmount = r2(lineItems.reduce((s, i) => s + i.itemTotal, 0));

    return {
        ...(formState.invoiceId && { invoiceId: Number(formState.invoiceId) }),
        supplyType: t.supplyType,
        docType: t.documentType,
        docNo: t.documentNumber,
        prefix: t.documentPrefix,
        docDate: t.documentDate.split('-').reverse().join('/'),
        reverseCharge: t.reverseCharge,
        igstOnIntraState: t.igstOnIntra,
        sellerDetails: {
            gstin: seller.sellerGstin,
            legalName: seller.legalName,
            tradeName: seller.tradeName,
            addr1: seller.address1,
            location: seller.location,
            pin: Number(seller.pinCode),
            stateCode: seller.state,
        },
        buyerDetails: {
            ...(buyer.customerId && { customerId: Number(buyer.customerId) }),
            gstin: buyer.buyerGstin,
            legalName: buyer.legalName,
            tradeName: buyer.tradeName,
            phoneNumber: buyer.phoneNumber,
            addr1: buyer.address1,
            location: buyer.location,
            pin: Number(buyer.pinCode),
            stateCode: buyer.state,
        },
        placeOfSupply: buyer.placeOfSupply,
        lineItems,
        totalTaxableValue,
        ...(igst
            ? { totalIgst: r2(lineItems.reduce((s, i) => s + (i.igstAmount ?? 0), 0)) }
            : {
                  totalCgst: r2(lineItems.reduce((s, i) => s + (i.cgstAmount ?? 0), 0)),
                  totalSgst: r2(lineItems.reduce((s, i) => s + (i.sgstAmount ?? 0), 0)),
              }),
        totalDiscount,
        totalAmount,
    };
};

const useGenerateIrn = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const submitIrn = useCallback(
        async (formState: GenerateIrnFormState) => {
            setIsSubmitting(true);
            const body = buildPayload(formState);
            const resp = await generateIrnApi({ userId: id, userType: role, body });
            setIsSubmitting(false);
            if (resp && resp.status) {
                dispatch(
                    showToast({
                        description: resp.message || 'IRN generated successfully.',
                        variant: 'success',
                    })
                );
                const detailId = resp.data?.id;
                if (detailId) {
                    navigate(
                        `/${paths.invoice.index}/${paths.invoice.eInvoiceDetails.replace(':id', String(detailId))}`
                    );
                } else {
                    navigate(`/${paths.invoice.index}/${paths.invoice.eInvoicingAll}`);
                }
            } else {
                dispatch(
                    showToast({
                        description: resp?.message || 'Failed to generate IRN.',
                        variant: 'error',
                    })
                );
            }
        },
        [id, role, dispatch, navigate]
    );

    return { submitIrn, isSubmitting };
};

export default useGenerateIrn;
