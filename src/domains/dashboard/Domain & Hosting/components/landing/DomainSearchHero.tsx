import React from 'react';

import { Button, Flex, Input, Typography } from 'antd';

const { Title, Text } = Typography;

interface Props {
    searchQuery: string;
    isLoading: boolean;
    hasResults: boolean;
    heroTitle: string;
    onSearchChange: (v: string) => void;
    onSearch: () => void;
    onReset: () => void;
}

const DomainSearchHero: React.FC<Props> = ({
    searchQuery,
    isLoading,
    hasResults,
    heroTitle,
    onSearchChange,
    onSearch,
    onReset,
}) => (
    <div
        className="rounded-3xl mb-10"
        style={{ background: 'linear-gradient(135deg, #FFF2F2 0%, #F0F5FA 100%)' }}
    >
        <Flex vertical align="center" className="py-12 sm:py-16 px-4 sm:px-6 gap-4">
            <Title level={2} className="!mb-0 text-center font-bold">
                {heroTitle}
            </Title>
            <Text className="text-gray-500 text-lg text-center font-medium">
                Fast, Simple & Reliable
            </Text>
            <Flex
                align="center"
                className="border border-gray-200 rounded-lg bg-white w-full max-w-2xl overflow-hidden"
            >
                <Input
                    variant="borderless"
                    placeholder="Search for a domain"
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value.replace(/[^a-zA-Z0-9.-]/g, ''))}
                    onPressEnter={onSearch}
                    disabled={isLoading}
                    className="flex-1 font-medium"
                />
                <Button
                    className="rounded-md m-1 bg-lightRed border-lightRed text-white"
                    onClick={onSearch}
                    loading={isLoading}
                >
                    Search
                </Button>
            </Flex>
            {hasResults && (
                <Button type="link" onClick={onReset} className="!text-gray-400 text-sm">
                    Clear results
                </Button>
            )}
        </Flex>
    </div>
);

export default DomainSearchHero;
