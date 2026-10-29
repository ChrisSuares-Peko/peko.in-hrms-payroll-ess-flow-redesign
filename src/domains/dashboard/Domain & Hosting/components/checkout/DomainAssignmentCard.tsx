import React, { useState } from 'react';

import { Button, Card, Flex, Input, Radio, type RadioChangeEvent, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { type DomainResult, type DomainSearchResults } from '../../types/index';

const { Title, Text } = Typography;

type DomainOption = 'register' | 'existing';

interface Props {
    assignedDomain: string | null;
    domainOption: DomainOption;
    onDomainOptionChange: (e: RadioChangeEvent) => void;
    domainSearch: string;
    onDomainSearchChange: (v: string) => void;
    existingDomain: string;
    onExistingDomainChange: (v: string) => void;
    availableDomains: DomainResult[];
    searchLoading: boolean;
    searchResults: DomainSearchResults | null;
    domainUpdateLoading: boolean;
    onDomainSearch: () => void;
    onExistingDomainSubmit: () => void;
    onAssignDomain: (domain: DomainResult) => Promise<void>;
    onChangeDomain: () => void;
}

const DomainAssignmentCard: React.FC<Props> = ({
    assignedDomain,
    domainOption,
    onDomainOptionChange,
    domainSearch,
    onDomainSearchChange,
    existingDomain,
    onExistingDomainChange,
    availableDomains,
    searchLoading,
    searchResults,
    domainUpdateLoading,
    onDomainSearch,
    onExistingDomainSubmit,
    onAssignDomain,
    onChangeDomain,
}) => {
    const navigate = useNavigate();
    const [existingDomainError, setExistingDomainError] = useState<string | null>(null);

    const handleExistingDomainChange = (v: string) => {
        onExistingDomainChange(v);
        if (v.trim()) setExistingDomainError(null);
    };

    const validateExistingDomain = (value: string): string | null => {
        const trimmed = value.trim();
        if (!trimmed) return 'Please enter a domain name';
        if (!/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/.test(trimmed))
            return 'Please enter a valid domain with a TLD (e.g. example.com)';
        const tld = trimmed.split('.').pop() ?? '';
        if (tld.length < 2) return 'TLD must be at least 2 characters (e.g. .com, .in)';
        return null;
    };

    const handleExistingDomainSubmit = () => {
        const validationError = validateExistingDomain(existingDomain);
        if (validationError) {
            setExistingDomainError(validationError);
            return;
        }
        setExistingDomainError(null);
        onExistingDomainSubmit();
    };

    return (
        <Card className="mb-6" style={{ maxWidth: 480 }}>
            <div className="mb-4">
                <Title level={5} style={{ margin: 0 }}>
                    Please assign a Domain Name to this package
                </Title>
            </div>

            {assignedDomain ? (
                <Flex justify="space-between" align="center">
                    <Text>
                        <span className="text-green-600 font-medium">{assignedDomain}</span>{' '}
                        assigned to hosting package
                    </Text>
                    <Button size="small" onClick={onChangeDomain}>
                        Change
                    </Button>
                </Flex>
            ) : (
                <Radio.Group value={domainOption} onChange={onDomainOptionChange}>
                    <Flex vertical gap={16}>
                        <Radio value="register">Register a New Domain</Radio>
                        {/* {domainOption === 'register' && (
                            <>
                                <Flex gap={8} align="start">
                                    <Flex vertical className="max-w-xs w-full">
                                        <Input
                                            placeholder="Enter a Domain name"
                                            value={domainSearch}
                                            onChange={e => {
                                                onDomainSearchChange(e.target.value);
                                                if (e.target.value.trim()) setDomainSearchError(null);
                                            }}
                                            onPressEnter={handleDomainSearch}
                                            status={domainSearchError ? 'error' : ''}
                                        />
                                        {domainSearchError && (
                                            <Text className="text-red-500 text-xs mt-1">
                                                {domainSearchError}
                                            </Text>
                                        )}
                                    </Flex>
                                    <Button
                                        className="bg-lightRed border-lightRed text-white"
                                        loading={searchLoading}
                                        onClick={handleDomainSearch}
                                    >
                                        Check Availability
                                    </Button>
                                </Flex>

                                {searchLoading && <Spin size="small" />}

                                {!searchLoading && availableDomains.length > 0 && (
                                    <Flex vertical gap={8}>
                                        {availableDomains.map(d => (
                                            <Flex
                                                key={d.domain}
                                                justify="space-between"
                                                align="center"
                                                className="py-2 px-3 border border-gray-200 rounded-lg"
                                            >
                                                <Flex vertical gap={2}>
                                                    <Text>{d.domain}</Text>
                                                    {d.price != null && (
                                                        <Text className="text-xs text-gray-400">
                                                            ₹{d.price}/yr
                                                        </Text>
                                                    )}
                                                </Flex>
                                                <Button
                                                    size="small"
                                                    className="border-red-400 text-red-400"
                                                    loading={domainUpdateLoading}
                                                    onClick={() => onAssignDomain(d)}
                                                >
                                                    Assign
                                                </Button>
                                            </Flex>
                                        ))}
                                    </Flex>
                                )}

                                {!searchLoading &&
                                    searchResults &&
                                    availableDomains.length === 0 && (
                                        <Text className="text-gray-400 text-sm">
                                            No available domains found. Try a different name.
                                        </Text>
                                    )}
                            </>
                        )} */}
                        {domainOption === 'register' && (
                            <Button danger onClick={() => navigate(`${paths.dashboard.domainHosting}?view=search`)}>Purchase a domain</Button>
                        )}

                        <Radio value="existing">I Already have a Domain Name</Radio>
                        {domainOption === 'existing' && (
                            <Flex gap={8} align="start">
                                <Flex vertical className="max-w-xs w-full">
                                    <Input
                                        placeholder="Enter your existing domain"
                                        value={existingDomain}
                                        onChange={e => handleExistingDomainChange(e.target.value)}
                                        status={existingDomainError ? 'error' : ''}
                                    />
                                    {existingDomainError && (
                                        <Text className="text-red-500 text-xs mt-1">
                                            {existingDomainError}
                                        </Text>
                                    )}
                                </Flex>
                                <Button
                                    className="bg-lightRed border-lightRed text-white"
                                    loading={domainUpdateLoading}
                                    onClick={handleExistingDomainSubmit}
                                >
                                    Submit
                                </Button>
                            </Flex>
                        )}
                    </Flex>
                </Radio.Group>
            )}
        </Card>
    );
};

export default DomainAssignmentCard;
