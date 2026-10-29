import React from 'react';

import { Flex, Table, Typography, Input, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type Props = {
    onChange?: (data: any) => void;
    fieldName?: string;
};

const TaxComputation: React.FC<Props> = ({ onChange, fieldName = 'taxComputation' }: any) => {
    const { setFieldValue, values: fieldValues } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;

    // Keep Formik and parent in sync when data changes
   

    const handleChange = (value: string, field: string) => {
        const updatedData = {
            ...(fieldValues?.[fieldName] || {}),
            [field]: value,
        };
        setFieldValue(fieldName, updatedData);
        onChange?.(updatedData);
    };

    const taxRows = [
        {
            key: '1',
            description: 'Income Tax (slab wise)',
            field: 'incomeTax',
        },
        {
            key: '2',
            description: 'Surcharge (if applicable)',
            field: 'surcharge',
        },
        {
            key: '3',
            description: 'Health & Education Cess @ 4%',
            field: 'cess',
        },
        {
            key: '4',
            description: 'Total Tax Liability',
            field: 'totalTaxLiability',
        },
        {
            key: '5',
            description: 'TDS Deducted (as per Part A)',
            field: 'tdsDeducted',
        },
        {
            key: '6',
            description: 'Balance / Refund',
            field: 'balanceOrRefund',
        },
    ];
    const blockNonNumeric = (e: React.KeyboardEvent) => {
        if (e.key.length === 1 && !/[0-9.]/.test(e.key)) e.preventDefault();
    };

    const getCurrentGroup = () => (fieldValues?.[fieldName] ?? {}) as Record<string, unknown>;
    const getGroupString = (k: string) => {
        const v = getCurrentGroup()[k];
        return typeof v === 'string' || typeof v === 'number' ? String(v) : '';
    };
    const columns = [
        {
            title: <Text strong>Description</Text>,
            dataIndex: 'description',
            key: 'description',
        },
        {
            title: <Text strong>Amount (₹)</Text>,
            key: 'amount',
            render: (_: any, record: any) => (
                <Input
                    placeholder="Enter"
                    value={getGroupString(record.field)}
                    onKeyDown={blockNonNumeric}
                    onChange={e => handleChange(e.target.value, record.field)}
                    style={{ width: '100%' }}
                />
            ),
        },
    ];

    return (
        <Flex className="mt-6 flex flex-col">
            <Text className="font-semibold text-lg mb-5 text-left">8. Tax Computation</Text>
            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    dataSource={taxRows}
                    columns={columns}
                    pagination={false}
                    bordered
                    scroll={isMobile ? { x: 780 } : undefined}
                />
            </div>
        </Flex>
    );
};

export default TaxComputation;
