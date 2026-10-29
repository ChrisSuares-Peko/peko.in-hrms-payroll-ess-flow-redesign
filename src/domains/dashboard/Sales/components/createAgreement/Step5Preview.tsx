import { forwardRef, useImperativeHandle } from 'react';

import { Flex, Skeleton, Typography } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import type { Step5Ref } from '../../types/createAgreement';
import { InvoiceAddressItem, InvoiceProfileData } from '../../types/settings';
import PDFViewer, { SignatureField } from '../shared/PDFViewer';

interface Props {
    agreementPrefix?: string;
    agreementNumber?: string;
    contractType?: string;
    title?: string;
    description?: string;
    startDate?: string;
    createdAt?: string;
    paymentTerms?: string;
    customerName?: string;
    customerAddress?: string;
    customerEmail?: string;
    customerPhone?: string;
    documentUrl?: string | null;
    documentFile?: File | null;
    signatureFields?: SignatureField[];
    businessProfile?: InvoiceProfileData | null;
    businessAddress?: InvoiceAddressItem | null;
    isBusinessLoading?: boolean;
}

const Step5Preview = forwardRef<Step5Ref, Props>(
    (
        {
            agreementPrefix = '',
            agreementNumber = '',
            contractType = '',
            title = '',
            description,
            startDate = '',
            createdAt = '',
            paymentTerms,
            customerName = '',
            customerAddress = '',
            customerEmail = '',
            customerPhone = '',
            documentUrl,
            documentFile,
            signatureFields = [],
            businessProfile: profile = null,
            businessAddress = null,
            isBusinessLoading = false,
        },
        ref
    ) => {

        useImperativeHandle(ref, () => ({
            getInitiatorInfo: () => ({
                email: profile?.email ?? '',
                name: profile?.name ?? '',
            }),
        }));

        const formattedBusinessAddress = businessAddress
            ? [
                  businessAddress.addressLine1,
                  businessAddress.addressLine2,
                  businessAddress.city,
                  businessAddress.state,
                  businessAddress.zipCode,
              ]
                  .filter(Boolean)
                  .join(', ')
            : '';

        const getSignerColor = (signerIndex: number) => {
            const colors = [
                { bg: '#D9EECC', border: '#05BE63', text: '#15803D' },
                { bg: '#DBEAFE', border: '#3B82F6', text: '#1D4ED8' },
            ];
            return colors[signerIndex % colors.length];
        };

        const getSignerName = (signerIndex: number) =>
            signerIndex === 0 ? customerName : `Signer ${signerIndex + 1}`;

        return (
            <Flex vertical gap={4} className="p-4 md:p-6">
                <Flex vertical gap={2}>
                    <TypographyText className="text-lg font-semibold">
                        Preview Agreement
                    </TypographyText>
                    <TypographyText className="text-sm text-gray-500">
                        Review the document carefully before sending to the customer.
                    </TypographyText>
                </Flex>

                <Flex
                    vertical
                    className="rounded-2xl border border-zinc-300 overflow-hidden"
                    style={{ boxShadow: '0px 2px 8px -2px rgba(16,24,40,0.08)' }}
                >
                    {/* Header */}
                    <Flex
                        justify="space-between"
                        align="center"
                        className="px-5 py-3 border-b border-zinc-300"
                        style={{ background: 'linear-gradient(to right, #FFF1F2, #FDF2F8)' }}
                    >
                        <Flex vertical gap={2}>
                            <Typography.Text className="text-sm font-semibold">
                                {contractType}
                            </Typography.Text>
                            <Typography.Text className="text-xs text-gray-500">
                                {agreementPrefix}
                                {agreementNumber} — {customerName}
                            </Typography.Text>
                        </Flex>
                        <Flex vertical gap={2} align="flex-end">
                            <Typography.Text className="text-xs text-gray-500">
                                Created
                            </Typography.Text>
                            <Typography.Text className="text-sm font-semibold">
                                {createdAt}
                            </Typography.Text>
                        </Flex>
                    </Flex>

                    <Flex vertical gap={4} className="p-6 bg-white">
                        {/* Title and Description */}
                        <Flex vertical align="center" gap={2} className="mb-2">
                            <Typography.Text className="text-base font-semibold">
                                {title}
                            </Typography.Text>
                            {description && (
                                <Typography.Text className="text-xs text-gray-500 text-center">
                                    {description}
                                </Typography.Text>
                            )}
                        </Flex>

                        {/* Business and Customer Cards */}
                        <Flex gap={12} className="mb-4 flex-col sm:flex-row">
                            {/* Service Provider */}
                            <Flex
                                vertical
                                gap={2}
                                className="flex-1 p-4 bg-gray-50 rounded-lg"
                                style={{ minHeight: 100 }}
                            >
                                <Typography.Text className="text-xs font-medium text-red-500">
                                    Service Provider
                                </Typography.Text>
                                {isBusinessLoading ? (
                                    <Flex vertical gap={6} className="mt-1">
                                        <Skeleton.Input active size="small" style={{ width: 120, height: 14 }} />
                                        <Skeleton.Input active size="small" style={{ width: 180, height: 12 }} />
                                        <Skeleton.Input active size="small" style={{ width: 140, height: 12 }} />
                                        <Skeleton.Input active size="small" style={{ width: 100, height: 12 }} />
                                    </Flex>
                                ) : (
                                    <>
                                        <Typography.Text className="text-sm font-medium">
                                            {profile?.name}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs whitespace-pre-line leading-5">
                                            {formattedBusinessAddress}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-gray-600">
                                            {profile?.email}
                                        </Typography.Text>
                                        <Typography.Text className="text-xs text-gray-600">
                                            {profile?.mobileNo}
                                        </Typography.Text>
                                    </>
                                )}
                            </Flex>

                            {/* Client */}
                            <Flex
                                vertical
                                gap={2}
                                className="flex-1 p-4 bg-gray-50 rounded-lg"
                                style={{ minHeight: 100 }}
                            >
                                <Typography.Text className="text-xs font-medium text-blue-500">
                                    Client
                                </Typography.Text>
                                <Typography.Text className="text-sm font-medium">
                                    {customerName}
                                </Typography.Text>
                                <Typography.Text className="text-xs whitespace-pre-line leading-5">
                                    {customerAddress}
                                </Typography.Text>
                                <Typography.Text className="text-xs text-gray-600">
                                    {customerEmail}
                                </Typography.Text>
                                {customerPhone && (
                                    <Typography.Text className="text-xs text-gray-600">
                                        {customerPhone}
                                    </Typography.Text>
                                )}
                            </Flex>
                        </Flex>

                        {/* Main Content Area */}
                        <Flex gap={12} className="flex-col lg:flex-row" align="flex-start">
                            {/* Agreement Preview */}
                            <Flex vertical className="flex-1 min-w-0 w-full">
                                {documentUrl || documentFile ? (
                                    <PDFViewer
                                        file={documentFile}
                                        documentUrl={documentUrl}
                                        signatureFields={signatureFields}
                                        showPageSelector={false}
                                        fileName={`${agreementPrefix}${agreementNumber} — ${customerName}`}
                                        getSignerName={getSignerName}
                                        getSignerColor={getSignerColor}
                                    />
                                ) : (
                                    <Flex
                                        justify="center"
                                        align="center"
                                        className="flex-1 text-gray-300 text-xs rounded-xl border border-gray-200 bg-gray-50"
                                        style={{ minHeight: 680 }}
                                    >
                                        Agreement Preview
                                    </Flex>
                                )}
                            </Flex>

                            {/* Right Side Info */}
                            <Flex vertical gap={12} className="w-full lg:w-[25%] lg:shrink-0">
                                {/* Start Date */}
                                <Flex
                                    vertical
                                    align="center"
                                    justify="center"
                                    gap={2}
                                    className="w-full border border-neutral-200 py-4 px-2 rounded-lg"
                                >
                                    <Typography.Text className="text-xs font-normal">
                                        Start Date
                                    </Typography.Text>
                                    <Typography.Text className="text-sm font-semibold text-violet-900">
                                        {startDate}
                                    </Typography.Text>
                                </Flex>

                                {/* Payment Terms */}
                                {paymentTerms && (
                                    <Flex
                                        vertical
                                        align="center"
                                        justify="center"
                                        gap={2}
                                        className="w-full border border-neutral-200 py-4 px-2 rounded-lg"
                                    >
                                        <Typography.Text className="text-xs font-normal">
                                            Payment Terms
                                        </Typography.Text>
                                        <Typography.Text className="text-sm font-semibold text-violet-900">
                                            {paymentTerms}
                                        </Typography.Text>
                                    </Flex>
                                )}
                            </Flex>
                        </Flex>
                    </Flex>
                </Flex>
            </Flex>
        );
    }
);

export default Step5Preview;
