import { type FC } from 'react';

import { Flex, Typography } from 'antd';

import { OndcProduct } from '../../types/products';
import { getBrand, getCountryOfOrigin, getHsn, getNetQuantity } from '../../utils/productAttributes';

const { Text } = Typography;

/** "Key attributes" card — divider-separated rows, only for data the seller provided. */
const KeyAttributes: FC<{ product?: OndcProduct | null }> = ({ product }) => {
    if (!product) return null;

    const rows: { label: string; value: string }[] = [
        { label: 'Brand', value: getBrand(product) },
        { label: 'Net quantity', value: getNetQuantity(product) },
        { label: 'Country of origin', value: getCountryOfOrigin(product) },
        { label: 'HSN code', value: getHsn(product) },
    ].filter(row => row.value);

    if (!rows.length) return null;

    return (
        <div className="rounded-2xl bg-white p-4 drop-shadow-[0px_1.2px_6px_rgba(0,0,0,0.06)]">
            <Flex align="center" justify="space-between" className="mb-4">
                <Text className="text-base font-semibold text-black">Key attributes</Text>
            </Flex>
            <Flex vertical gap={10}>
                {rows.map((row, i) => (
                    <div key={row.label}>
                        {i > 0 && <div className="mb-2.5 h-px w-full bg-[#e4e4e7]" />}
                        <Flex align="center" justify="space-between" className="text-sm">
                            <Text className="text-[#6b6b6b]">{row.label}</Text>
                            <Text className="font-medium tracking-[-0.15px] text-[#0a0a0a]">
                                {row.value}
                            </Text>
                        </Flex>
                    </div>
                ))}
            </Flex>
        </div>
    );
};

export default KeyAttributes;
