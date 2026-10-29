import React, { useEffect, useRef, useState } from 'react';

import { HistoryOutlined } from '@ant-design/icons';
import { Input, Typography, Card, Flex, InputRef, Spin } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { ReactSVG } from 'react-svg';

import useServiceSearch from '@src/hooks/useServiceSearch';
import { paths } from '@src/routes/paths';

import searchIcon from '../../../assets/icons/searchIcon.svg';

// Resolves a configured pathKey to a URL.
//   "corporateTravel"          → paths.dashboard.corporateTravel   → /corporate-travel
//   "corporateTravel/airline"  → + paths.airline.index             → /corporate-travel/airline
//   "billPayments/electricity" → + paths.billPayments.electricity  → /utility-payments/electricity-bill
//   "/some/literal/url"        → used as-is
// Each child segment is looked up in its parent's section first, then as its own section's
// index; unknown segments are kept verbatim so raw child routes still work.
const resolveServicePath = (pathKey?: string): string | undefined => {
    const key = pathKey?.trim();
    if (!key) return undefined;
    if (key.startsWith('/')) return key;

    type Section = Record<string, unknown> | undefined;
    const allPaths = paths as Record<string, unknown>;
    const [root, ...children] = key.split('/').filter(Boolean);
    const dashboardPaths = paths.dashboard as Record<string, unknown>;
    const rootPath = typeof dashboardPaths[root] === 'string' ? dashboardPaths[root] : `/${root}`;

    let parent = allPaths[root] as Section;
    const childPaths = children.map(segment => {
        const fromParent = parent?.[segment];
        const ownSection = allPaths[segment] as Section;
        parent = ownSection;
        if (typeof fromParent === 'string') return fromParent;
        if (typeof ownSection?.index === 'string') return ownSection.index;
        return segment;
    });
    return [rootPath, ...childPaths].join('/');
};

type ServiceSearchProps = {
    classes?: string;
    variant: 'filled' | 'outlined' | 'borderless';
};
const ServiceSearch = ({ classes, variant }: ServiceSearchProps) => {
    let toggleTimeout: any;
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const [searchValue, setSearchValue] = useState('');
    const [dropdownVisible, setDropdownVisible] = useState(false);
    const [selectedService, setSelectedService] = useState<any>(null);
    const { histories, services, isLoading, getHistories, saveSearch } =
        useServiceSearch(searchValue);
    const inputRef = useRef<InputRef | null>(null);

    const handleFocus = () => {
        setDropdownVisible(true);
    };
    const handleBlur = () => {
        toggleTimeout = setTimeout(() => {
            inputRef.current?.blur();
            setDropdownVisible(false);
        }, 1000);
    };

    const handleServiceSelect = (service: any) => {
        setSelectedService(service);
        setSearchValue(service.name);
        getHistories();
        const target = resolveServicePath(service.pathKey);
        if (target) navigate(target);
    };
    const handleSearchChange = (e: any) => {
        setSearchValue(e.target.value);
        setDropdownVisible(true);
    };

    useEffect(() => {
        setDropdownVisible(false);
        return () => {
            clearTimeout(toggleTimeout);
        };
    }, [pathname, toggleTimeout]);
    useEffect(() => {
        if (pathname !== resolveServicePath(selectedService?.pathKey)) {
            setSelectedService(null);
            setSearchValue('');
        }
    }, [pathname, selectedService?.pathKey]);

    return (
        <div className="w-full max-w-x h-full mx-auto relative" onMouseLeave={handleBlur}>
            <Input
                size="large"
                placeholder="Search for services and features"
                suffix={
                    <ReactSVG
                        beforeInjection={svg => {
                            svg.setAttribute('style', 'width: 23px; height: 23px;');
                        }}
                        src={searchIcon}
                        className="text-base text-center"
                    />
                }
                value={searchValue}
                allowClear
                onChange={handleSearchChange}
                onFocus={handleFocus}
                className="w-full rounded-lg border-none"
                ref={inputRef}
                variant={variant}
                style={variant === 'borderless' ? { paddingLeft: 0 } : undefined}
                rootClassName="custom-search-input" // ✅ Apply class to wrapper
            />
            {dropdownVisible && (
                <Card
                    className={`w-full ${classes} shadow-lg rounded-none rounded-b-2xl border-t-0 absolute z-10 bg-white`}
                    bodyStyle={{
                        padding: '15px',
                        marginRight: '10px',
                    }}
                >
                    <Flex vertical className="px-2">
                        {isLoading ? (
                            <Flex justify="center" className="py-4">
                                <Spin />
                            </Flex>
                        ) : (
                            <Flex vertical gap={10}>
                                {services.map((service, index) => (
                                    <Flex
                                        gap={10}
                                        align="center"
                                        key={index}
                                        className="w-full p-1 hover:bg-gray-50 rounded cursor-pointer"
                                        onClick={() => {
                                            handleServiceSelect(service);
                                            saveSearch(service?.name);
                                        }}
                                    >
                                        <ReactSVG
                                            beforeInjection={svg => {
                                                svg.setAttribute(
                                                    'style',
                                                    'width: 16px; height: 16px;'
                                                );
                                            }}
                                            src={searchIcon}
                                            className="text-base text-center"
                                        />

                                        <Typography.Text>{service.name}</Typography.Text>
                                    </Flex>
                                ))}
                                {services.length <= 0 &&
                                    histories.map((option, index) => (
                                        <Flex
                                            gap={10}
                                            align="center"
                                            key={index}
                                            className="w-full p-1 hover:bg-gray-50 rounded cursor-pointer"
                                            onClick={() => setSearchValue(option)}
                                        >
                                            <HistoryOutlined
                                                className="text-xs mt-[0.1rem]"
                                                size={10}
                                            />
                                            <Typography.Text>{option}</Typography.Text>
                                        </Flex>
                                    ))}
                                {histories.length === 0 && (
                                    <Typography.Text className="text-center py-4 text-gray-500">
                                        No search history found
                                    </Typography.Text>
                                )}
                            </Flex>
                        )}
                    </Flex>
                </Card>
            )}
        </div>
    );
};

export default ServiceSearch;
