import React from 'react';

import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

interface StepperProps {
    value: number;
    min?: number;
    max?: number;
    disabled?: boolean;
    onChange: (next: number) => void;
}

const Stepper: React.FC<StepperProps> = ({ value, min = 0, max, disabled, onChange }) => {
    const decrement = () => {
        if (disabled) return;
        const next = Math.max(min, value - 1);
        if (next !== value) onChange(next);
    };
    const increment = () => {
        if (disabled) return;
        const next = typeof max === 'number' ? Math.min(max, value + 1) : value + 1;
        if (next !== value) onChange(next);
    };

    return (
        <Flex
            align="center"
            className="rounded-full border border-neutral-200 bg-white"
            style={{ overflow: 'hidden' }}
        >
            <Button
                type="text"
                size="small"
                icon={<MinusOutlined style={{ fontSize: 12 }} />}
                disabled={disabled || value <= min}
                onClick={decrement}
                style={{ borderRadius: 0, width: 32, height: 32 }}
            />
            <span
                style={{
                    minWidth: 28,
                    textAlign: 'center',
                    fontWeight: 500,
                    fontSize: 14,
                    color: '#171717',
                }}
            >
                {value}
            </span>
            <Button
                type="text"
                size="small"
                icon={<PlusOutlined style={{ fontSize: 12 }} />}
                disabled={disabled || (typeof max === 'number' && value >= max)}
                onClick={increment}
                style={{ borderRadius: 0, width: 32, height: 32 }}
            />
        </Flex>
    );
};

export default Stepper;
