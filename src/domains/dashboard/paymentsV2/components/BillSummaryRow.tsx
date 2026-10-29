import React, { useEffect, useRef, useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { InputNumber } from 'antd';
import type { GetRef } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import useScreenSize from '@src/hooks/useScreenSize';
import { getSurcharge } from '@src/services/surcharge';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../../payments/slices/payment';

interface BulkPaymentData {
    amount: number;
}

interface BillSummaryRowProps {
    headName: string;
    value: string | number;
    isInput?: boolean;
    subText?: string;
    tag?: string;
    setIsCashbackChecked?: React.Dispatch<React.SetStateAction<boolean>>;
    isLoading?: boolean;
    removeCoupon?: () => void;
    onAmountUpdatingChange?: (isUpdating: boolean) => void;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

const BillSummaryRow = ({
    headName,
    value,
    isInput,
    subText,
    tag,
    setIsCashbackChecked,
    isLoading,
    removeCoupon,
    onAmountUpdatingChange,
}: BillSummaryRowProps) => {
    const dispatch = useAppDispatch();
    const paymentState = useAppSelector(state => state.reducer.payment);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { xs } = useScreenSize();
    const [amount, setAmount] = useState<number | string | null>(value || null);
    const [isEditable, setIsEditable] = useState<boolean>(false);
    const inputRef = useRef<GetRef<typeof InputNumber>>(null);
    const latestFeeRequest = useRef(0);

    useEffect(() => {
        if (isEditable) inputRef.current?.focus();
    }, [isEditable]);

    // Derive current surcharge from state — avoids depending on formatted string in paymentSummary
    const currentSurcharge = (() => {
        const diff = Number(paymentState.totalAmount) - Number(paymentState.payload?.amount || 0);
        return Number.isNaN(diff) ? 0 : diff;
    })();
    const billerResponse = paymentState.payload?.billerResponse;
    const billerResponseObject = isObjectRecord(billerResponse) ? billerResponse : null;

    // Seller-supplied ONDC row titles can collide with these labels, and those rows
    // already arrive pre-formatted as "₹ 5.00" — don't decorate them twice.
    const needsCurrencyPrefix =
        (headName === 'Amount' || headName === 'Convenience Fee') && !String(value).includes('₹');

    // Only amounts get pinned to one line — text values (biller names, routes) must still wrap.
    const displayValue = needsCurrencyPrefix ? `₹ ${value}` : value;
    const isCurrency = String(displayValue).trimStart().startsWith('₹');

    function validateAmount(newAmount: string | number | null) {
        if (newAmount === null || newAmount === '' || Number(newAmount) <= 0) {
            return null;
        }
        let updatedAmount = Number(newAmount);

        if (paymentState?.minimumAmount && updatedAmount < paymentState?.minimumAmount) {
            updatedAmount = paymentState?.minimumAmount;
        } else if (paymentState?.maximumAmount && updatedAmount > paymentState?.maximumAmount) {
            updatedAmount = paymentState?.maximumAmount;
        }
        return updatedAmount;
    }

    const handleAmountChange = (newAmount: string | number | null) => {
        if (newAmount === null || newAmount === '') {
            setAmount(null);
            return;
        }
        if (Number.isNaN(Number(newAmount))) return;
        setAmount(newAmount);

        const updatedBillSummary = paymentState?.billSummary.map(item => {
            if (item.key === 'Amount') {
                return { ...item, value: Number(newAmount) };
            }
            return item;
        });
        let updatedBulkPaymentData: BulkPaymentData[] = Array.isArray(
            paymentState?.payload?.bulkPaymentData
        )
            ? paymentState.payload.bulkPaymentData
            : [];
        if (updatedBulkPaymentData.length === 1 && updatedBulkPaymentData[0]) {
            updatedBulkPaymentData = [{ ...updatedBulkPaymentData[0], amount: Number(newAmount) }];
        }
        dispatch(
            setPaymentData({
                ...paymentState,
                totalAmount: Number(newAmount) + currentSurcharge,
                payload: {
                    ...paymentState.payload,
                    amount: Number(newAmount),
                    bulkPaymentData: updatedBulkPaymentData,
                    ...(billerResponseObject ? { billerResponse: billerResponseObject } : {}),
                },
                billSummary: updatedBillSummary,
            })
        );
        setIsCashbackChecked!(false);
    };

    if (isInput) {
        return (
            <div className="flex w-full flex-col gap-2">
                <span className="text-sm font-normal text-slate-500">{headName}</span>
                {subText && <span className="-mt-1 text-xs text-slate-400">{subText}</span>}
                <InputNumber
                    ref={inputRef}
                    controls={false}
                    value={amount}
                    placeholder={xs ? 'Amount' : 'Please Enter the amount'}
                    disabled={!isEditable}
                    maxLength={6}
                    className="w-full"
                    onKeyDown={e => {
                        const currentValue = (e.target as HTMLInputElement).value;
                        if (e.key === '.' && currentValue.includes('.')) {
                            e.preventDefault();
                        } else if (
                            !/[\d.]/.test(e.key) &&
                            !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(
                                e.key
                            )
                        ) {
                            e.preventDefault();
                        }
                    }}
                    onChange={e => handleAmountChange(e)}
                    onBlur={async () => {
                        setIsEditable(false);
                        const updatedAmount = validateAmount(amount);
                        setAmount(updatedAmount);
                        if (!updatedAmount || Number(updatedAmount) <= 0) return;
                        latestFeeRequest.current += 1;
                        const feeRequest = latestFeeRequest.current;
                        const surchargeData = await getSurcharge({
                            userId: id,
                            userType: role,
                            amount: Number(updatedAmount),
                            accessKey: paymentState.payload?.accessKey!,
                            billerId: paymentState.payload?.billerId,
                        });
                        if (feeRequest !== latestFeeRequest.current) return;
                        const ccf1Rupees = surchargeData
                            ? parseFloat(surchargeData.ccf1Amount ?? '0') / 100
                            : 0;
                        const platformFee = surchargeData
                            ? Number(surchargeData.surcharge) + ccf1Rupees
                            : 0;
                        const updatedPaymentSummary = paymentState.paymentSummary.map(item =>
                            item.key === 'Platform fee (inclusive of GST)'
                                ? {
                                      ...item,
                                      value: `₹ ${formatNumberWithLocalString(platformFee)}`,
                                  }
                                : item
                        );
                        const updatedBillSummary = paymentState.billSummary.map(item =>
                            item.key === 'Amount' ? { ...item, value: Number(updatedAmount) } : item
                        );
                        dispatch(
                            setPaymentData({
                                ...paymentState,
                                totalAmount: Number(updatedAmount) + platformFee,
                                earningCashbackAmount: surchargeData
                                    ? Number(surchargeData.corporateCashback)
                                    : paymentState.earningCashbackAmount,
                                paymentSummary: updatedPaymentSummary,
                                billSummary: updatedBillSummary,
                                payload: {
                                    ...paymentState.payload,
                                    amount: Number(updatedAmount),
                                    ccf1Amount: surchargeData
                                        ? surchargeData.ccf1Amount || null
                                        : null,
                                    ...(billerResponseObject
                                        ? { billerResponse: billerResponseObject }
                                        : {}),
                                },
                            })
                        );
                        if (surchargeData) onAmountUpdatingChange?.(false);
                    }}
                    addonAfter={
                        <EditOutlined
                            onClick={() => {
                                if (isLoading) return;
                                if (removeCoupon) removeCoupon();
                                latestFeeRequest.current += 1;
                                onAmountUpdatingChange?.(true);
                                setIsEditable(true);
                            }}
                            className={
                                isLoading || isEditable
                                    ? 'text-black text-opacity-25'
                                    : 'cursor-pointer text-black'
                            }
                        />
                    }
                />
            </div>
        );
    }

    return (
        <div className="flex w-full items-start justify-between gap-3">
            <span className="flex min-w-0 flex-col">
                <span className="text-sm font-normal text-slate-500">{headName}</span>
                {subText && <span className="text-xs text-slate-400">{subText}</span>}
            </span>
            <span className="flex shrink-0 items-center justify-end gap-2 whitespace-nowrap text-right text-sm font-semibold text-slate-800">
                {tag && (
                    <span className="rounded border border-green-200 bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
                        {tag}
                    </span>
                )}
                <span className={isCurrency ? 'whitespace-nowrap' : undefined}>
                    {displayValue}
                </span>
            </span>
        </div>
    );
};

export default BillSummaryRow;
