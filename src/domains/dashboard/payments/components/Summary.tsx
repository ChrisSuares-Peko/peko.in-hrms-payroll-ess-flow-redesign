import React, { useState } from 'react';

import { EditOutlined } from '@ant-design/icons';
import { Col, InputNumber, Row, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { getSurcharge } from '@src/services/surcharge';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { setPaymentData } from '../slices/payment';

interface BulkPaymentData {
    amount: number;
}
interface SummaryProps {
    headName: string;
    value: string | number;
    isInput?: boolean;
    subText?: string;
    setIsCashbackChecked?: React.Dispatch<React.SetStateAction<boolean>>;
}

function isObjectRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

const Summary = ({ headName, value, isInput, subText, setIsCashbackChecked }: SummaryProps) => {
    const dispatch = useAppDispatch();
    const paymentState = useAppSelector(state => state.reducer.payment);
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [amount, setAmount] = useState<number | string | null>(value || null);
    const [isEditable, setIsEditable] = useState<boolean>(false);

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
                    ...(billerResponseObject
                        ? { billerResponse: billerResponseObject }
                        : {}),
                },
                billSummary: updatedBillSummary,
            })
        );
        setIsCashbackChecked!(false);
    };

    return (
        <Row>
            <Col span={14}>
                <Typography.Text className="text-sm font-normal sm:text-base">
                    {headName}
                </Typography.Text>
                {subText && (
                    <Typography.Text className="block text-xs text-textBody sm:text-sm">
                        {subText}
                    </Typography.Text>
                )}
            </Col>
            <Col span={10}>
                {isInput ? (
                    <InputNumber
                        controls={false}
                        value={amount}
                        placeholder="Please Enter the amount"
                        disabled={!isEditable}
                        maxLength={
                            paymentState?.maximumAmount && paymentState.maximumAmount > 999999
                                ? String(Math.floor(paymentState.maximumAmount)).length + 3
                                : 6
                        }
                        onKeyDown={e => {
                            const currentValue = (e.target as HTMLInputElement).value;
                            if (e.key === '.' && currentValue.includes('.')) {
                                e.preventDefault();
                            } else if (!/[\d.]/.test(e.key) && !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) {
                                e.preventDefault();
                            }
                        }}
                        onChange={e => handleAmountChange(e)}
                        onBlur={async () => {
                            setIsEditable(false);
                            const updatedAmount = validateAmount(amount);
                            setAmount(updatedAmount);
                            if (!updatedAmount || Number(updatedAmount) <= 0) return;
                            const surchargeData = await getSurcharge({
                                userId: id,
                                userType: role,
                                amount: Number(updatedAmount),
                                accessKey: paymentState.payload?.accessKey!,
                                billerId: paymentState.payload?.billerId,
                            });
                            const ccf1Rupees = surchargeData ? parseFloat(surchargeData.ccf1Amount ?? '0') / 100 : 0;
                            const platformFee = surchargeData ? Number(surchargeData.surcharge) + ccf1Rupees : 0;
                            const updatedPaymentSummary = paymentState.paymentSummary.map(item =>
                                item.key === 'Platform fee (inclusive of GST)'
                                    ? { ...item, value: `₹ ${formatNumberWithLocalString(platformFee)}` }
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
                                        ccf1Amount: surchargeData ? surchargeData.ccf1Amount || null : null,
                                        ...(billerResponseObject
                                            ? { billerResponse: billerResponseObject }
                                            : {}),
                                    },
                                })
                            );
                        }}
                        addonAfter={
                            <EditOutlined
                                onClick={() => setIsEditable(true)}
                                className={`${isEditable ? 'text-black text-opacity-25 ' : 'text-black'}`}
                            />
                        }
                    />
                ) : (
                    <Typography.Text className="text-sm font-medium sm:text-base">
                        {needsCurrencyPrefix ? '₹ ' : ''}{' '}
                        {value}
                    </Typography.Text>
                )}
            </Col>
        </Row>
    );
};

export default Summary;
