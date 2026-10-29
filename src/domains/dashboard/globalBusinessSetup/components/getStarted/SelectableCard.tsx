import React from 'react';

import { Flex } from 'antd';

import useScreenSize from '@src/hooks/useScreenSize';

interface SelectableCardProps {
    selected: boolean;
    disabled?: boolean;
    onClick?: () => void;
    children: React.ReactNode;
    padding?: number | string;
    align?: 'center' | 'flex-start';
    trailing?: React.ReactNode;
    fullWidth?: boolean;
}

const SelectableCard: React.FC<SelectableCardProps> = ({
    selected,
    disabled,
    onClick,
    children,
    padding,
    align = 'center',
    trailing,
    fullWidth,
}) => {
    const { xs } = useScreenSize();
    const radio = selected ? (
        <div
            style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#FF4F4F',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
            }}
        >
            <div
                style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <div
                    style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: '#FF4F4F',
                    }}
                />
            </div>
        </div>
    ) : (
        <div
            style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                border: '1.5px solid #D4D4D8',
                background: '#fff',
                flexShrink: 0,
                boxSizing: 'border-box',
            }}
        />
    );
    const trailingNode = trailing !== undefined ? trailing : radio;

    return (
        <Flex
            align={align}
            justify="space-between"
            gap={12}
            onClick={disabled ? undefined : onClick}
            className={`rounded-2xl transition-all ${
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
            }`}
            style={{
                border: selected ? '1px solid #FF4F4F' : '1px solid #E5E7EB',
                background: '#fff',
                padding: padding ?? (xs ? 16 : '20px 24px'),
                boxShadow: selected
                    ? '0px 1.56px 15.58px 1.43px rgba(255, 79, 79, 0.06)'
                    : undefined,
                transition: 'all 0.2s ease',
                height: '100%',
                ...(fullWidth ? { width: '100%' } : {}),
            }}
        >
            <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
            {trailingNode}
        </Flex>
    );
};

export default SelectableCard;
