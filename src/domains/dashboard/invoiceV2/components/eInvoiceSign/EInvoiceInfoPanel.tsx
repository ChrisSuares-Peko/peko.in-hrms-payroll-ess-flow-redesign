import React from 'react';

import { Flex } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';

import gstnLogo from '../../assets/icons/eInvoice/gstn-logo.svg';
import { E_INVOICE_FEATURES } from '../../constants/eInvoicingSign';

const EInvoiceInfoPanel: React.FC = () => (
    <Flex
        vertical
        className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-[#EEF4FF] to-[#FFF1F2] px-5 py-6 md:px-8 md:py-8"
    >
        <Flex vertical gap={24} className="relative">
            {/* Header */}
            <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
                <TypographyText className="text-base font-semibold leading-6">
                    E-Invoice Portal
                </TypographyText>
                <Flex align="center" gap={6}>
                    <TypographyText className="text-sm font-normal leading-5">
                        Powered by
                    </TypographyText>
                    <img src={gstnLogo} alt="GSTN" className="h-[22px] w-[40px]" />
                </Flex>
            </Flex>

            <Flex vertical gap={32}>
                {/* Hero copy */}
                <Flex vertical gap={16} align="center" className="text-center self-stretch">
                    <TypographyText className="text-[#475467] text-sm font-normal leading-5">
                        What is E-Invoice?
                    </TypographyText>
                    <Flex vertical gap={8} align="center" className="self-stretch">
                        <TypographyText className="text-xl md:text-2xl font-semibold leading-7 text-center">
                            Every invoice, registered in
                            <br />
                            real-time with GSTIN.
                        </TypographyText>
                        <TypographyText className="text-[#475467]/75 text-xs font-normal leading-4 max-w-[520px]">
                            E-Invoicing makes your B2B invoices legally valid the moment they are
                            created — with a unique reference number (IRN) and a digital signature
                            from the GST portal.
                        </TypographyText>
                    </Flex>
                </Flex>

                {/* Feature cards */}
                <Flex vertical gap={12}>
                    {E_INVOICE_FEATURES.map(({ id, title, description, icon }) => (
                        <Flex
                            key={id}
                            vertical
                            gap={2}
                            className="w-full px-4 py-3 bg-white rounded-xl"
                        >
                            <img src={icon} alt="" aria-hidden className="h-5 w-5" />
                            <TypographyText className="text-sm font-semibold leading-5">
                                {title}
                            </TypographyText>
                            <TypographyText className="text-[#475467] text-xs font-normal leading-4">
                                {description}
                            </TypographyText>
                        </Flex>
                    ))}
                </Flex>
            </Flex>
        </Flex>
    </Flex>
);

export default EInvoiceInfoPanel;
