import { useState } from 'react';

import { Button, Card, Flex } from 'antd';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';

import TermsIcon from '../../assets/icons/book-1.svg';
import CommercialRentIcon from '../../assets/icons/commerial.svg';
import PrivacyIcon from '../../assets/icons/document-1.svg';
import DocIcon from '../../assets/icons/document-text.svg';
import EmploymentIcon from '../../assets/icons/employe_contract.svg';
import FreelanceIcon from '../../assets/icons/employees-departments.svg';
import FoundersIcon from '../../assets/icons/founder-agreement.svg';
import IPIcon from '../../assets/icons/ip.svg';
import ArrowWhiteIcon from '../../assets/icons/line-arrow-right-white.svg';
import ArrowRedIcon from '../../assets/icons/line-arrow-right.svg';
import LoanIcon from '../../assets/icons/money_bag.svg';
import NDAIcon from '../../assets/icons/non-disclosure.svg';
import SaaSIcon from '../../assets/icons/saas-subscription.svg';
import ShareholderIcon from '../../assets/icons/share_holder.svg';
import VendorIcon from '../../assets/icons/vendor.svg';
import type { MyTemplate } from '../../types';

const ICON_SRC_MAP: Record<string, string> = {
    nda: NDAIcon,
    employment: EmploymentIcon,
    privacy: PrivacyIcon,
    founders: FoundersIcon,
    freelance: FreelanceIcon,
    terms: TermsIcon,
    ip: IPIcon,
    shareholder: ShareholderIcon,
    vendor: VendorIcon,
    loan: LoanIcon,
    saas: SaaSIcon,
    commercial: CommercialRentIcon,
};

interface MyTemplatesProps {
    templates: MyTemplate[];
    onViewAll?: () => void;
    onUseTemplate?: (template: MyTemplate) => void;
}

const MyTemplates = ({ templates, onViewAll, onUseTemplate }: MyTemplatesProps) => {
    const [useHovered, setUseHovered] = useState<string | null>(null);
    return (
        <Card
            variant="borderless"
            className="w-full bg-white rounded-3xl outline outline-[0.5px] outline-stone-300"
            styles={{ body: { padding: 24 } }}
        >
            <Flex vertical gap={26}>
                <Flex justify="space-between" align="flex-start">
                    <Flex vertical gap={4}>
                        <TypographyText className="text-lg font-semibold font-['Roboto'] block">
                            My Templates
                        </TypographyText>
                        <TypographyText className="text-base font-normal font-['Roboto'] text-gray-500 block">
                            Your saved reusable templates
                        </TypographyText>
                    </Flex>
                    <Button
                        type="text"
                        onClick={onViewAll}
                        className="p-0 !h-auto !text-[#FF3A3A] text-base font-normal font-['Roboto'] hover:!text-[#e02020] hover:!bg-transparent flex items-center gap-1"
                    >
                        View all
                        <ReactSVG
                            src={ArrowRedIcon}
                            beforeInjection={svg =>
                                svg.setAttribute('style', 'width: 16px; height: 16px;')
                            }
                        />
                    </Button>
                </Flex>

                <Flex vertical gap={14}>
                    {templates.map(template => (
                        <Flex
                            key={template.id}
                            justify="space-between"
                            align="center"
                            className="py-3 px-4 rounded-xl bg-white outline outline-[0.5px] outline-stone-300 hover:bg-pink-50 transition-colors"
                        >
                            <Flex align="center" gap={12} className="min-w-0 flex-1">
                                <Flex
                                    align="center"
                                    justify="center"
                                    className="w-9 h-9 flex-shrink-0 rounded-lg bg-white shadow-sm"
                                >
                                    <ReactSVG
                                        src={
                                            (template.iconKey
                                                ? ICON_SRC_MAP[template.iconKey]
                                                : undefined) ??
                                            template.iconSrc ??
                                            DocIcon
                                        }
                                        beforeInjection={svg => {
                                            svg.setAttribute('width', '24');
                                            svg.setAttribute('height', '24');
                                        }}
                                    />
                                </Flex>
                                <Flex vertical gap={2} className="min-w-0">
                                    <TypographyText className="text-gray-800 text-sm font-medium font-['Roboto'] leading-5 block truncate">
                                        {template.title}
                                    </TypographyText>
                                    {template.subTitle ? (
                                        <TypographyText className="text-gray-400 text-xs font-normal font-['Roboto'] block truncate">
                                            {template.subTitle}
                                        </TypographyText>
                                    ) : null}
                                </Flex>
                            </Flex>
                            <Button
                                onClick={() => onUseTemplate?.(template)}
                                onMouseEnter={() => setUseHovered(template.id)}
                                onMouseLeave={() => setUseHovered(null)}
                                className="rounded-md !border-[#FF3A3A] !text-[#FF3A3A] text-xs font-medium flex-shrink-0 hover:!bg-[#FF3A3A] hover:!text-white hover:!border-[#FF3A3A] flex items-center gap-1"
                                size="small"
                            >
                                Use
                                <ReactSVG
                                    src={useHovered === template.id ? ArrowWhiteIcon : ArrowRedIcon}
                                    beforeInjection={svg =>
                                        svg.setAttribute('style', 'width: 16px; height: 16px;')
                                    }
                                />
                            </Button>
                        </Flex>
                    ))}

                    {templates.length === 0 && (
                        <TypographyText className="text-gray-400 text-sm text-center py-4 block">
                            No templates saved yet
                        </TypographyText>
                    )}
                </Flex>
            </Flex>
        </Card>
    );
};

export default MyTemplates;
