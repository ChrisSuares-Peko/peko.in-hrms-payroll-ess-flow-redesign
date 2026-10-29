import React from 'react';

import { Col, Flex, Row } from 'antd';

import GenericTable from '@components/atomic/GenericTable';
import TypographyText from '@components/atomic/typography/typographyText';

import { TABLE_HEADER_STYLE } from '../../constants/style';
import {
    BuyerFormValues,
    ItemsFormValues,
    SellerFormValues,
    TransactionFormValues,
    ReviewLineItem,
} from '../../types/generateIrn';
import { calcCgst, calcIgst, calcTaxable, calcTotal } from '../../utils/generateIrnCalculations';
import { formatAmount } from '../../utils/helperFunctions';
import reviewIrnColumns from '../../utils/table_column/reviewIrnColumns';
import AlertCard from '../shared/AlertCard';
import LabelValueRow from '../shared/LabelValueRow';
import ReviewCard from '../shared/ReviewCard';

interface Props {
    transaction: TransactionFormValues;
    seller: SellerFormValues;
    buyer: BuyerFormValues;
    items: ItemsFormValues;
}

const ReviewStep: React.FC<Props> = ({ transaction, seller, buyer, items }) => {
    const { igstOnIntra } = transaction;
    const useIgst = igstOnIntra || seller.state !== buyer.placeOfSupply;

    const grandTotal = items.items.reduce((s, it) => s + calcTotal(it), 0);

    const reviewItems: ReviewLineItem[] = items.items.map(it => ({
        id: it.id,
        description: it.description,
        hsnSac: it.hsnSac,
        quantity: it.quantity,
        unit: it.unit,
        discount: it.discount,
        gstRate: it.gstRate,
        taxableAmount: calcTaxable(it),
        tax: useIgst ? calcIgst(it) : calcCgst(it) * 2,
        itemTotal: calcTotal(it),
    }));

    const transactionRows = [
        { label: 'Supply Type', value: transaction.supplyType },
        { label: 'Doc Type', value: transaction.documentType },
        {
            label: 'Doc Number',
            value: `${transaction.documentPrefix}${transaction.documentNumber}`,
        },
        { label: 'Doc Date', value: transaction.documentDate },
        { label: 'Reverse Charge', value: transaction.reverseCharge ? 'Yes' : 'No' },
        { label: 'IGST on Intra-State', value: transaction.igstOnIntra ? 'Yes' : 'No' },
    ];

    const sellerRows = [
        { label: 'GSTIN', value: seller.sellerGstin },
        { label: 'Legal Name', value: seller.legalName },
        ...(seller.tradeName ? [{ label: 'Trade Name', value: seller.tradeName }] : []),
        { label: 'Address', value: seller.address1 },
        { label: 'Location', value: `${seller.location} - ${seller.pinCode}` },
        { label: 'State', value: seller.state },
    ];

    const buyerRows = [
        { label: 'GSTIN', value: buyer.buyerGstin },
        { label: 'Legal Name', value: buyer.legalName },
        ...(buyer.tradeName ? [{ label: 'Trade Name', value: buyer.tradeName }] : []),
        { label: 'Address', value: buyer.address1 },
        { label: 'Location', value: `${buyer.location} - ${buyer.pinCode}` },
        { label: 'State', value: buyer.state },
        { label: 'Place of Supply', value: buyer.placeOfSupply },
    ];

    return (
        <Flex vertical gap={20}>
            <AlertCard
                variant="info"
                description={
                    <>
                        Please review all details carefully. Once an IRN is generated,{' '}
                        <strong>it cannot be modified</strong>. It can only be cancelled within 24
                        hours.
                    </>
                }
            />

            <Row gutter={[16, 16]}>
                <Col xs={24} lg={8}>
                    <ReviewCard title="Transaction" rows={transactionRows} />
                </Col>
                <Col xs={24} lg={8}>
                    <ReviewCard title="Seller" rows={sellerRows} />
                </Col>
                <Col xs={24} lg={8}>
                    <ReviewCard title="Buyer" rows={buyerRows} />
                </Col>
            </Row>

            <Flex vertical gap={8}>
                <TypographyText className="text-sm font-semibold">
                    Line Items ({items.items.length})
                </TypographyText>
                <Flex
                    vertical
                    className="rounded-2xl overflow-hidden outline outline-1 outline-[#EFF1F4] [&>div:first-child]:hidden"
                >
                    <GenericTable
                        dataSource={reviewItems}
                        columns={reviewIrnColumns(useIgst)}
                        rowKey="id"
                        components={{
                            header: {
                                cell: ({
                                    style,
                                    ...rest
                                }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
                                    <th {...rest} style={{ ...style, ...TABLE_HEADER_STYLE }} />
                                ),
                            },
                        }}
                    />
                    <Flex justify="flex-end" className="px-5 py-4 bg-[#F9FAFB]">
                        <Flex
                            vertical
                            gap={8}
                            className="w-full sm:w-auto sm:ml-auto sm:min-w-[300px]"
                        >
                            <LabelValueRow
                                label="Invoice Total"
                                value={formatAmount(grandTotal)}
                                bold
                            />
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        </Flex>
    );
};

export default ReviewStep;
