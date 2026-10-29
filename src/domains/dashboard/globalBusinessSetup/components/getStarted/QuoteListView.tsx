import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import JurisdictionSummary from './JurisdictionSummary';
import QuoteCard from './QuoteCard';
import { Quote } from '../../hooks/useQuotesByCountryType';
import { ProvidersEmptyState } from '../ProviderEmptyCard';

interface QuoteListViewProps {
    countryName: string;
    countryFlag?: string;
    countryCode?: string;
    companyTypeLabel: string;
    quotes: Quote[];
    onProceed: (quote: Quote) => void;
    onChangeJurisdiction: () => void;
}

const QuoteListView: React.FC<QuoteListViewProps> = ({
    countryName,
    countryFlag,
    countryCode,
    companyTypeLabel,
    quotes,
    onProceed,
    onChangeJurisdiction,
}) => (
    <Flex vertical gap={24} className="mx-auto" style={{ width: '100%', maxWidth: 1100 }}>
        <JurisdictionSummary
            countryName={countryName}
            countryFlag={countryFlag}
            countryCode={countryCode}
            companyTypeLabel={companyTypeLabel}
            onChange={onChangeJurisdiction}
        />

        {quotes.length === 0 ? (
            <ProvidersEmptyState />
        ) : (
            <Flex vertical gap={16}>
                <Typography.Text className="text-base font-semibold text-neutral-900">
                    Best options for you
                </Typography.Text>
                <Row gutter={[16, 16]}>
                    {quotes.map(quote => (
                        <Col xs={24} md={12} lg={8} key={quote.id}>
                            <QuoteCard quote={quote} onProceed={() => onProceed(quote)} />
                        </Col>
                    ))}
                </Row>
            </Flex>
        )}
    </Flex>
);

export default QuoteListView;
