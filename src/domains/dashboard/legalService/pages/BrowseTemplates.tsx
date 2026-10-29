import React, { useState } from 'react';
import type { ReactNode } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Pagination } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';
import useDebounceSearch from '@src/hooks/useDebounceSearch';

import TermsIcon from '../assets/icons/book-1.svg';
import CommercialIcon from '../assets/icons/commerial.svg';
import PrivacyIcon from '../assets/icons/document-1.svg';
import DocIcon from '../assets/icons/document-text.svg';
import EmploymentIcon from '../assets/icons/employe_contract.svg';
import FreelanceIcon from '../assets/icons/employees-departments.svg';
import FoundersIcon from '../assets/icons/founder-agreement.svg';
import IPIcon from '../assets/icons/ip.svg';
import LoanIcon from '../assets/icons/money_bag.svg';
import NDAIcon from '../assets/icons/non-disclosure.svg';
import SaaSIcon from '../assets/icons/saas-subscription.svg';
import ShareholderIcon from '../assets/icons/share_holder.svg';
import VendorIcon from '../assets/icons/vendor.svg';
import TemplateCard from '../components/landingPage/TemplateCard';
import { TemplateCardGridSkeleton } from '../components/shared/TemplateCardSkeleton';
import useLegalTemplates from '../hooks/useLegalDocs';
import usePersonalTemplates from '../hooks/usePersonalTemplates';

const ICON_MAP: Record<string, string> = {
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
    commercial: CommercialIcon,
};

const makeSvgIcon = (src: string): ReactNode => (
    <ReactSVG
        src={src}
        beforeInjection={svg => {
            svg.setAttribute('width', '36');
            svg.setAttribute('height', '36');
            svg.setAttribute('style', 'max-width: 36px; max-height: 36px;');
        }}
    />
);

const MY_TEMPLATES_KEY = 'My Templates';

const BrowseTemplates = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const initialCategory = (location.state as { category?: string } | null)?.category ?? 'All';
    const [activeCategory, setActiveCategory] = useState<string>(initialCategory);
    const [filters, setFilters] = useState({ searchText: '' });
    const { updateSearchText, searchText: searchInputText } = useDebounceSearch(setFilters);
    const [page, setPage] = useState(1);
    const isMyTemplates = activeCategory === MY_TEMPLATES_KEY;

    const handleCategoryChange = (cat: string) => {
        setActiveCategory(cat);
        setPage(1);
    };
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        updateSearchText(e);
        setPage(1);
    };
    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const text = e.clipboardData.getData('text');
        if (
            /\p{Emoji_Presentation}|\p{Extended_Pictographic}|\p{Emoji_Modifier_Base}|\p{Emoji_Modifier}/gu.test(
                text
            )
        ) {
            e.preventDefault();
        }
    };

    const { templates: allTemplatesForCategories } = useLegalTemplates(
        undefined,
        undefined,
        1,
        1000
    );
    const {
        templates,
        total: templatesTotal,
        isLoading,
    } = useLegalTemplates(
        filters.searchText,
        activeCategory !== 'All' && !isMyTemplates ? activeCategory : undefined,
        isMyTemplates ? undefined : page
    );
    const {
        templates: personalTemplates,
        total: personalTotal,
        isLoading: isPersonalLoading,
    } = usePersonalTemplates(12, filters.searchText, isMyTemplates ? page : undefined);

    const allCategories = [
        'All',
        ...Array.from(new Set(allTemplatesForCategories.map(t => t.category))),
        MY_TEMPLATES_KEY,
    ];
    const categories = Array.from(new Set(allCategories));

    const isAll = activeCategory === 'All';
    const showSkeleton = isLoading || isPersonalLoading;
    const activeTotal = isMyTemplates ? personalTotal : templatesTotal;

    return (
        <Flex vertical gap={32} className="pt-4 bg-white min-h-screen">
            {/* Page header */}
            <Flex vertical gap={4}>
                <TypographyText className="text-2xl font-semibold font-['Roboto'] leading-8 block">
                    Browse Templates
                </TypographyText>
                <TypographyText className="text-lg font-normal font-['Roboto'] leading-7 text-gray-500 block">
                    India-compliant legal document templates
                </TypographyText>
            </Flex>

            {/* Filters */}
            <Flex vertical gap={24}>
                <Flex align="flex-start" gap={16} className="flex-col sm:flex-row">
                    <Input
                        prefix={<SearchOutlined className="text-gray-400" />}
                        placeholder="Search Templates"
                        value={searchInputText}
                        onChange={handleSearch}
                        onPaste={handlePaste}
                        allowClear
                        className="w-full sm:w-80 md:w-96 h-10 rounded-lg"
                    />
                    <Flex gap={8} wrap="wrap">
                        {categories.map(cat => (
                            <Button
                                key={cat}
                                onClick={() => handleCategoryChange(cat)}
                                className={`h-9 px-3 rounded-xl text-sm font-medium leading-5 font-['Roboto'] transition-colors ${
                                    activeCategory === cat
                                        ? '!bg-pink-50 !border-[#FF3A3A] !text-[#FF3A3A]'
                                        : '!border-neutral-200 !text-[#FF3A3A] !bg-white hover:!bg-pink-50'
                                }`}
                            >
                                {cat}
                            </Button>
                        ))}
                    </Flex>
                </Flex>

                {showSkeleton && <TemplateCardGridSkeleton count={9} />}

                {!showSkeleton && (
                    <Flex vertical gap={32}>
                        {/* My Templates section — shown when "All" or "My Templates" filter is active, and there are personal templates */}
                        {(isAll || isMyTemplates) && personalTemplates.length > 0 && (
                            <Flex vertical gap={16}>
                                <Flex align="center" gap={16}>
                                    <div className="flex-1 h-px bg-stone-200" />
                                    <TypographyText className="text-gray-400 text-base font-medium font-['Roboto'] whitespace-nowrap">
                                        My Templates
                                    </TypographyText>
                                    <div className="flex-1 h-px bg-stone-200" />
                                </Flex>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {personalTemplates.map((template: any) => (
                                        <TemplateCard
                                            key={template.id}
                                            title={template.title}
                                            description={template.category ?? ''}
                                            timeEstimate={template.timeEstimate ?? '—'}
                                            category={template.category}
                                            icon={makeSvgIcon(
                                                template.iconKey && ICON_MAP[template.iconKey]
                                                    ? ICON_MAP[template.iconKey]
                                                    : DocIcon
                                            )}
                                            isFeatured={false}
                                            onUse={() =>
                                                navigate(
                                                    `/more-services/legal-service/personal-document/${template.id}`
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </Flex>
                        )}

                        {/* Pre-defined Templates — shown when not on "My Templates" filter and there are templates */}
                        {!isMyTemplates && templates.length > 0 && (
                            <Flex vertical gap={16}>
                                {isAll && personalTemplates.length > 0 && (
                                    <Flex align="center" gap={16}>
                                        <div className="flex-1 h-px bg-stone-200" />
                                        <TypographyText className="text-gray-400 text-base font-medium font-['Roboto'] whitespace-nowrap">
                                            Pre-defined Templates
                                        </TypographyText>
                                        <div className="flex-1 h-px bg-stone-200" />
                                    </Flex>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                                    {templates.map(template => (
                                        <TemplateCard
                                            key={template.id}
                                            title={template.title}
                                            description={template.description}
                                            timeEstimate={template.timeEstimate ?? '—'}
                                            category={template.category}
                                            icon={makeSvgIcon(
                                                template.iconKey && ICON_MAP[template.iconKey]
                                                    ? ICON_MAP[template.iconKey]
                                                    : DocIcon
                                            )}
                                            isFeatured={false}
                                            onUse={() =>
                                                navigate(
                                                    `/more-services/legal-service/document/${template.id}`
                                                )
                                            }
                                        />
                                    ))}
                                </div>
                            </Flex>
                        )}

                        {/* Empty state — no results at all */}
                        {personalTemplates.length === 0 && templates.length === 0 && (
                            <Flex justify="center" align="center" className="py-16">
                                <TypographyText className="text-gray-400 text-base font-['Roboto']">
                                    No templates available.
                                </TypographyText>
                            </Flex>
                        )}

                        {/* Pagination */}
                        {activeTotal > 12 && (
                            <Flex justify="center" className="pt-4">
                                <Pagination
                                    current={page}
                                    total={activeTotal}
                                    pageSize={12}
                                    onChange={setPage}
                                    showSizeChanger={false}
                                />
                            </Flex>
                        )}
                    </Flex>
                )}
            </Flex>
        </Flex>
    );
};

export default BrowseTemplates;
