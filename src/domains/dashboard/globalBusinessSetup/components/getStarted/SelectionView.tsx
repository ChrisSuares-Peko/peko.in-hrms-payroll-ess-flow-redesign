/* eslint-disable no-nested-ternary */
import React, { useMemo, useState } from 'react';

import { SearchOutlined } from '@ant-design/icons';
import { Empty, Flex, Input, Row, Col, Spin } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';
import { removeEmoji } from '@utils/regex';

import CompanyTypeCard from './CompanyTypeCard';
import CompanyTypeViewToggle, { CompanyTypeView } from './CompanyTypeViewToggle';
import CountryCard from './CountryCard';
import FreezoneCard from './FreezoneCard';
import JurisdictionSummary from './JurisdictionSummary';
import StepHeader from './StepHeader';
import { Country } from '../../types/globalBusinessSetup';

interface SelectionViewProps {
    step: 1 | 2 | 3;
    countriesAndDetails: Country[];
    countriesLoading: boolean;
    countryId: string;
    companyType: string;
    freezone: string;
    onCountryChange: (id: string) => void;
    onCompanyTypeChange: (key: string) => void;
    onFreezoneChange: (key: string) => void;
    onJumpToStep: (next: 1 | 2 | 3) => void;
    hideFreezoneStep?: boolean;
}

const formatLabel = (s: string) =>
    s
        .split('_')
        .map(w => (w.toUpperCase() === w ? w : w.charAt(0).toUpperCase() + w.slice(1)))
        .join(' ');

const StepCard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { xs } = useScreenSize();
    return (
        <div
            className="bg-white rounded-3xl mx-auto"
            style={{
                boxShadow: '0px 4px 24px rgba(0, 0, 0, 0.08)',
                padding: xs ? 16 : 32,
                width: '100%',
                maxWidth: 1200,
            }}
        >
            <div style={{ width: '100%' }}>{children}</div>
        </div>
    );
};

const VIEW_STORAGE_KEY = 'peko_company_type_view';

const SelectionView: React.FC<SelectionViewProps> = ({
    step,
    countriesAndDetails,
    countriesLoading,
    countryId,
    companyType,
    freezone,
    onCountryChange,
    onCompanyTypeChange,
    onFreezoneChange,
    onJumpToStep,
    hideFreezoneStep = false,
}) => {
    const [countrySearch, setCountrySearch] = useState('');

    const [companyTypeView, setCompanyTypeView] = useState<CompanyTypeView>(() => {
        if (typeof window === 'undefined') return 'overview';
        try {
            const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
            return stored === 'compare' ? 'compare' : 'overview';
        } catch {
            return 'overview';
        }
    });
    const handleCompanyTypeViewChange = (next: CompanyTypeView) => {
        setCompanyTypeView(next);
        try {
            window.localStorage.setItem(VIEW_STORAGE_KEY, next);
        } catch {
            /* localStorage unavailable */
        }
    };

    const filteredCountries = useMemo(() => {
        const term = countrySearch.trim().toLowerCase();
        if (!term) return countriesAndDetails;
        return countriesAndDetails.filter(c => c.name.toLowerCase().includes(term));
    }, [countriesAndDetails, countrySearch]);

    const selectedCountry = useMemo(
        () => countriesAndDetails.find(c => c._id === countryId),
        [countriesAndDetails, countryId]
    );

    const activeCompanyTypes = useMemo(
        () => (selectedCountry?.company_types ?? []).filter(c => c.is_active === true),
        [selectedCountry]
    );

    const hasComparableAttributes = useMemo(
        () => activeCompanyTypes.some(ct => (ct.attributes ?? []).some(attr => attr.label?.trim())),
        [activeCompanyTypes]
    );
    const canCompare = activeCompanyTypes.length >= 2 && hasComparableAttributes;
    const effectiveCompanyTypeView: CompanyTypeView = canCompare ? companyTypeView : 'overview';

    const selectedCompanyType = useMemo(
        () => activeCompanyTypes.find(c => c.key === companyType),
        [activeCompanyTypes, companyType]
    );

    const activeFreezones = useMemo(
        () => (selectedCompanyType?.freezones ?? []).filter(f => f.is_active === true),
        [selectedCompanyType]
    );

    const selectedFreezone = useMemo(
        () => activeFreezones.find(f => f.key === freezone),
        [activeFreezones, freezone]
    );

    const summaryCompanyTypeLabel = companyType
        ? selectedCompanyType?.label === 'Freezone'
            ? 'Free Zone'
            : selectedCompanyType?.label || formatLabel(companyType)
        : '';

    const summaryFreezoneLabel = freezone
        ? selectedFreezone?.label || formatLabel(freezone)
        : undefined;

    const summary = step > 1 && countryId && (
        <div className="mx-auto" style={{ width: '100%', maxWidth: 1200 }}>
            <JurisdictionSummary
                countryName={selectedCountry?.name ?? ''}
                countryFlag={selectedCountry?.logo}
                countryCode={selectedCountry?.country_code}
                companyTypeLabel={summaryCompanyTypeLabel}
                freezoneLabel={summaryFreezoneLabel}
                onChange={() => onJumpToStep(1)}
                onResetCountry={() => onJumpToStep(1)}
                onResetCompanyType={companyType ? () => onJumpToStep(2) : undefined}
                onResetFreezone={freezone ? () => onJumpToStep(3) : undefined}
            />
        </div>
    );

    return (
        <Flex vertical gap={32}>
            {summary}

            {step === 1 && (
                <StepCard>
                    <Flex vertical gap={20}>
                        <StepHeader
                            index={1}
                            title="Select Country"
                            subtitle="Where will the company be incorporated?"
                            required
                        />
                        <Input
                            placeholder="Search for countries"
                            prefix={<SearchOutlined className="text-gray-400" />}
                            value={countrySearch}
                            onChange={e => {
                                const sanitized = e.target.value
                                    .replace(removeEmoji, '')
                                    .replace(/[^a-zA-Z0-9.\-/@& ]/g, '')
                                    .trimStart();
                                setCountrySearch(sanitized);
                            }}
                            size="large"
                            allowClear
                        />
                        {countriesLoading ? (
                            <Flex justify="center" className="py-8">
                                <Spin />
                            </Flex>
                        ) : filteredCountries.length === 0 ? (
                            <Empty description="No countries found" />
                        ) : (
                            <Flex
                                vertical
                                gap={12}
                                style={{
                                    maxHeight: 460,
                                    overflowY: 'auto',
                                    paddingRight: 4,
                                }}
                            >
                                {filteredCountries.map(country => (
                                    <CountryCard
                                        key={country._id}
                                        country={country}
                                        selected={country._id === countryId}
                                        onSelect={() => onCountryChange(country._id)}
                                    />
                                ))}
                            </Flex>
                        )}
                    </Flex>
                </StepCard>
            )}

            {step === 2 && (
                <StepCard>
                    <Flex vertical gap={20}>
                        <Flex justify="space-between" align="flex-start" gap={12} wrap="wrap">
                            <StepHeader
                                index={2}
                                title="Type of Company"
                                subtitle="Each type bundles its own jurisdictions and pricing rules."
                                required
                            />
                            {canCompare && (
                                <CompanyTypeViewToggle
                                    value={effectiveCompanyTypeView}
                                    onChange={handleCompanyTypeViewChange}
                                />
                            )}
                        </Flex>
                        {activeCompanyTypes.length === 0 ? (
                            <Empty description="No company types available for this country" />
                        ) : (
                            <Row gutter={[16, 16]}>
                                {activeCompanyTypes.map(ct => {
                                    const lgSpan = Math.max(
                                        8,
                                        Math.floor(24 / activeCompanyTypes.length)
                                    );
                                    return (
                                        <Col xs={24} md={12} lg={lgSpan} key={ct.key}>
                                            <CompanyTypeCard
                                                typeKey={ct.key}
                                                label={
                                                    ct.label === 'Freezone'
                                                        ? 'Free Zone'
                                                        : ct.label || formatLabel(ct.key)
                                                }
                                                description={ct.description}
                                                attributes={ct.attributes}
                                                requiredDocsFile={ct.required_documents_file}
                                                requiredDocsText={ct.required_documents_text}
                                                compareMode={effectiveCompanyTypeView === 'compare'}
                                                selected={ct.key === companyType}
                                                onSelect={() => onCompanyTypeChange(ct.key)}
                                            />
                                        </Col>
                                    );
                                })}
                            </Row>
                        )}
                    </Flex>
                </StepCard>
            )}

            {step === 3 && !hideFreezoneStep && (
                <StepCard>
                    <Flex vertical gap={20}>
                        <StepHeader
                            index={3}
                            title="Preferred Freezone / State / Jurisdiction"
                            subtitle={`${activeFreezones.length} configured for ${
                                selectedCompanyType?.label || formatLabel(companyType)
                            } in ${selectedCountry?.name ?? ''}.`}
                            required
                        />
                        {activeFreezones.length === 0 ? (
                            <Empty description="No freezones available for this type" />
                        ) : (
                            <Flex vertical gap={12}>
                                {activeFreezones.map(fz => (
                                    <FreezoneCard
                                        key={fz.key}
                                        label={fz.label || formatLabel(fz.key)}
                                        selected={fz.key === freezone}
                                        onSelect={() => onFreezoneChange(fz.key)}
                                        icon={fz.icon}
                                        description={fz.description}
                                        attributes={fz.attributes}
                                        requiredDocsFile={fz.required_documents_file}
                                        requiredDocsText={fz.required_documents_text}
                                    />
                                ))}
                            </Flex>
                        )}
                    </Flex>
                </StepCard>
            )}
        </Flex>
    );
};

export default SelectionView;
