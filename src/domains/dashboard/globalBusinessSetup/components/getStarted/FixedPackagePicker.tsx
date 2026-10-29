import React from 'react';

import { Col, Flex, Row, Typography } from 'antd';

import SelectableCard from './SelectableCard';
import { FixedPackage } from '../../types/pricing';
import { fmt } from '../../utils/pricingCalc';
import RupeeSymbol from '../RupeeSymbol';

interface FixedPackagePickerProps {
    packages: FixedPackage[];
    selectedIdx: number;
    onSelect: (idx: number) => void;
    currency?: string;
}

const FixedPackagePicker: React.FC<FixedPackagePickerProps> = ({
    packages,
    selectedIdx,
    onSelect,
    currency,
}) => {
    if (packages.length === 0) return null;

    return (
        <Flex vertical gap={12}>
            <Typography.Text className="text-base font-semibold text-neutral-900">
                Select Package
            </Typography.Text>
            <Row gutter={[12, 12]}>
                {packages.map((pkg, idx) => {
                    const visaCount = pkg.visas ?? 0;
                    return (
                        <Col xs={24} md={12} key={`${pkg.label}-${idx}`}>
                            <SelectableCard
                                selected={idx === selectedIdx}
                                onClick={() => onSelect(idx)}
                                padding="16px 20px"
                            >
                                <Flex vertical gap={6}>
                                    <Typography.Text className="text-sm font-semibold text-neutral-900">
                                        {pkg.label}{' '}
                                        <span className="text-neutral-500 font-normal">
                                            ({visaCount} visa{visaCount === 1 ? '' : 's'})
                                        </span>
                                    </Typography.Text>
                                    <Flex align="center" gap={4}>
                                        <RupeeSymbol size={14} currency={currency} />
                                        <Typography.Text className="text-base font-semibold text-neutral-900">
                                            {fmt(pkg.price)}
                                        </Typography.Text>
                                    </Flex>
                                </Flex>
                            </SelectableCard>
                        </Col>
                    );
                })}
            </Row>
        </Flex>
    );
};

export default FixedPackagePicker;
