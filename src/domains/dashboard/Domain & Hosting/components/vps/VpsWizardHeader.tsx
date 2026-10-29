import React from 'react';

import { RightOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import IndiaFlagIcon from '../../assets/svg/india.svg';
import UsaFlagIcon from '../../assets/svg/usa.svg';

const { Title } = Typography;

const WIZARD_STEPS = [
    { n: 1 as const, label: 'Select a Plan' },
    { n: 2 as const, label: 'Choose Add-ons' },
];

const LOCATIONS = [
    { key: 'us' as const, label: 'USA', icon: UsaFlagIcon },
    { key: 'india' as const, label: 'India', icon: IndiaFlagIcon },
] as const;

interface VpsWizardHeaderProps {
    step: 1 | 2;
    serverLocation: 'india' | 'us';
    setServerLocation: (loc: 'india' | 'us') => void;
    onBack: () => void;
}

const VpsWizardHeader: React.FC<VpsWizardHeaderProps> = ({
    step,
    serverLocation,
    setServerLocation,
    onBack,
}) => (
    <>
        <div className="text-center mb-4">
            <Title level={2} style={{ margin: 0 }}>
                Set Up Your VPS In 2 Easy Steps
            </Title>
        </div>

        <div className="relative flex flex-col lg:flex-row items-center justify-center gap-3 mb-5 lg:min-h-10">
            <Flex align="center" gap={0}>
                {WIZARD_STEPS.map(({ n, label }, i) => (
                    <Flex key={n} align="center" gap={0}>
                        {i > 0 && (
                            <RightOutlined
                                style={{
                                    color: '#9CA3AF',
                                    fontSize: 12,
                                    margin: '0 12px',
                                    flexShrink: 0,
                                }}
                            />
                        )}
                        <Flex
                            align="center"
                            gap={10}
                            onClick={() => n === 1 && step === 2 && onBack()}
                            style={{ cursor: n === 1 && step === 2 ? 'pointer' : 'default' }}
                        >
                            <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === n ? 'bg-lightRed text-white' : 'bg-gray-200 text-gray-500'}`}
                            >
                                {n}
                            </div>
                            <span
                                className={step === n ? 'text-gray-900' : 'text-gray-400'}
                                style={{
                                    fontSize: 14,
                                    fontWeight: step === n ? 600 : 400,
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {label}
                            </span>
                        </Flex>
                    </Flex>
                ))}
            </Flex>

            {step === 1 && (
                <div className="lg:absolute lg:right-0 bg-gray-100 inline-flex items-center gap-1 rounded-full p-1">
                    {LOCATIONS.map(({ key, label, icon }) => {
                        const isActive = serverLocation === key;
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setServerLocation(key)}
                                className={`inline-flex items-center gap-2 cursor-pointer rounded-full py-1.5 pr-3.5 pl-1.5 ${isActive ? 'bg-white' : 'bg-transparent'}`}
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    transition: 'background 0.2s',
                                    boxShadow: isActive
                                        ? '0 1px 2px rgba(0,0,0,0.06)'
                                        : 'none',
                                }}
                            >
                                <img
                                    src={icon}
                                    alt={label}
                                    className="rounded-full object-cover"
                                    style={{ width: 22, height: 22 }}
                                />
                                <span
                                    className={isActive ? 'text-lightRed font-semibold' : 'text-gray-700 font-medium'}
                                    style={{ fontSize: 13 }}
                                >
                                    {label}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    </>
);

export default VpsWizardHeader;
