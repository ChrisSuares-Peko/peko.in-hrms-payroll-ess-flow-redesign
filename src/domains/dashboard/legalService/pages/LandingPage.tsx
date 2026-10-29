import type { ReactNode } from 'react';
import { useState } from 'react';

import { Button, Card, Flex } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';
import { paths } from '@src/routes/paths';

import TermsIcon from '../assets/icons/book-1.svg';
import CommercialRentIcon from '../assets/icons/commerial.svg';
import PrivacyIcon from '../assets/icons/document-1.svg';
import EmploymentIcon from '../assets/icons/employe_contract.svg';
import FreelanceIcon from '../assets/icons/employees-departments.svg';
import FoundersIcon from '../assets/icons/founder-agreement.svg';
import IPIcon from '../assets/icons/ip.svg';
import ArrowIcon from '../assets/icons/line-arrow-right.svg';
import LoanIcon from '../assets/icons/money_bag.svg';
import NDAIcon from '../assets/icons/non-disclosure.svg';
import SaaSIcon from '../assets/icons/saas-subscription.svg';
import ShareholderIcon from '../assets/icons/share_holder.svg';
import VendorIcon from '../assets/icons/vendor.svg';
import AllDocumentsDrawer from '../components/landingPage/AllDocumentsDrawer';
import MyTemplates from '../components/landingPage/MyTemplates';
import RecentDocuments from '../components/landingPage/RecentDocuments';
import TemplateCard from '../components/landingPage/TemplateCard';
import LandingPageSkeleton from '../components/shared/LandingPageSkeleton';
import useDocuments from '../hooks/useDocuments';
import useLegalTemplates from '../hooks/useLegalDocs';
import usePersonalTemplates from '../hooks/usePersonalTemplates';
import type { LegalTemplate, MyTemplate } from '../types';

const makeSvgIcon = (src: string) => (
    <ReactSVG
        src={src}
        beforeInjection={svg => {
            svg.setAttribute('width', '36');
            svg.setAttribute('height', '36');
            svg.setAttribute('style', 'max-width: 36px; max-height: 36px;');
        }}
    />
);

const ICON_MAP: Record<string, ReactNode> = {
    nda: makeSvgIcon(NDAIcon),
    employment: makeSvgIcon(EmploymentIcon),
    privacy: makeSvgIcon(PrivacyIcon),
    founders: makeSvgIcon(FoundersIcon),
    freelance: makeSvgIcon(FreelanceIcon),
    terms: makeSvgIcon(TermsIcon),
    ip: makeSvgIcon(IPIcon),
    shareholder: makeSvgIcon(ShareholderIcon),
    vendor: makeSvgIcon(VendorIcon),
    loan: makeSvgIcon(LoanIcon),
    saas: makeSvgIcon(SaaSIcon),
    commercial: makeSvgIcon(CommercialRentIcon),
};

const TEMPLATES_PER_ROW = 2;

const LandingPage = () => {
    const navigate = useNavigate();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const { templates, isLoading } = useLegalTemplates();
    const [docStatusFilter, setDocStatusFilter] = useState<string>('All');
    const { documents: recentDocuments } = useDocuments({
        limit: 5,
        status: docStatusFilter === 'All' ? undefined : docStatusFilter.toUpperCase(),
    });
    const { templates: personalTemplatesRaw } = usePersonalTemplates(5);

    if (isLoading) return <LandingPageSkeleton />;

    const myTemplates: MyTemplate[] = personalTemplatesRaw.map(t => ({
        id: String(t.id),
        title: t.title,
        subTitle: t.category ?? '',
        iconKey: t.iconKey ?? undefined,
    }));
    const preview = templates.slice(0, 8);
    const templateRows: LegalTemplate[][] = [];
    for (let i = 0; i < preview.length; i += TEMPLATES_PER_ROW) {
        templateRows.push(preview.slice(i, i + TEMPLATES_PER_ROW));
    }

    return (
        <Flex vertical gap={26} className="pt-4 bg-white min-h-screen">
            {/* Page header */}
            <Flex vertical gap={4}>
                <TypographyText className="text-2xl font-semibold font-['Roboto'] leading-8 block">
                    Legal Docs
                </TypographyText>
                <TypographyText className="text-lg font-normal font-['Roboto'] leading-7 text-gray-500 block">
                    Manage your documents and templates.
                </TypographyText>
            </Flex>

            {/* Main content */}
            <Flex gap={25} align="flex-start" className="flex-col xl:flex-row">
                {/* Left: Browse Templates */}
                <Card
                    variant="borderless"
                    className="w-full xl:flex-1 rounded-[32px] bg-white"
                    style={{ boxShadow: '0px 8px 24px 0px rgba(0, 0, 0, 0.10)' }}
                    styles={{ body: { padding: '24px 20px 24px' } }}
                >
                    <Flex vertical gap={24}>
                        {/* Section header */}
                        <Flex justify="space-between" align="flex-start">
                            <Flex vertical gap={4}>
                                <TypographyText className="text-lg font-semibold font-['Roboto'] leading-[26px] block">
                                    Browse Templates
                                </TypographyText>
                                <TypographyText className="text-base font-normal font-['Roboto'] leading-7 text-gray-500 block">
                                    India-compliant pre-built documents
                                </TypographyText>
                            </Flex>
                            <Button
                                onClick={() => navigate(paths.legalService.browseTemplates)}
                                className="flex items-center gap-1 border-0 bg-transparent shadow-none p-0 !h-auto text-[#FF3A3A] text-base font-normal font-['Roboto'] hover:!text-[#e02020] hover:!bg-transparent"
                            >
                                View all
                                <ReactSVG
                                    src={ArrowIcon}
                                    beforeInjection={svg =>
                                        svg.setAttribute('style', 'width: 16px; height: 16px;')
                                    }
                                />
                            </Button>
                        </Flex>

                        {/* Template grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                            {templateRows.flat().map(template => (
                                <TemplateCard
                                    key={template.id}
                                    title={template.title}
                                    description={template.description}
                                    timeEstimate={template.timeEstimate ?? '—'}
                                    category={template.category}
                                    icon={template.iconKey ? ICON_MAP[template.iconKey] : undefined}
                                    isFeatured={false}
                                    onUse={() => navigate(`document/${template.id}`)}
                                />
                            ))}
                        </div>
                    </Flex>
                </Card>

                {/* Right: My Templates + Recent Documents */}
                <Flex vertical gap={24} className="w-full xl:w-[380px] xl:flex-shrink-0">
                    <MyTemplates
                        templates={myTemplates}
                        onViewAll={() =>
                            navigate('browse-templates', { state: { category: 'My Templates' } })
                        }
                        onUseTemplate={template => navigate(`personal-document/${template.id}`)}
                    />
                    <RecentDocuments
                        documents={recentDocuments}
                        onViewAll={() => setDrawerOpen(true)}
                        onDocumentClick={doc => navigate(`document/${doc.id}/details`)}
                        onSend={_doc => {}}
                        onTabChange={setDocStatusFilter}
                    />
                    <AllDocumentsDrawer
                        open={drawerOpen}
                        onClose={() => setDrawerOpen(false)}
                        onDocumentClick={doc => {
                            setDrawerOpen(false);
                            navigate(`document/${doc.id}/details`);
                        }}
                    />
                </Flex>
            </Flex>
        </Flex>
    );
};

export default LandingPage;
