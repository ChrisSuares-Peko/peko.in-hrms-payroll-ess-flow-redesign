import React from 'react';

import { Table, Typography, Input, Flex, Grid } from 'antd';
import { useFormikContext } from 'formik';

const { Text } = Typography;

type Props = {
    onChange?: (rowData: any, incomeChargeable: number) => void;
    fieldName?: string;
};

const IncomeChargableAtSalary: React.FC<Props> = ({
    onChange,
    fieldName = 'incomeChargableAtSalary',
}: any) => {
    const { setFieldValue,values } = useFormikContext<any>();
    const screens = Grid.useBreakpoint();
    const isMobile = !screens.md;
    const headerStyle = { color: '#42526D', fontWeight: 600 };

    const row = values?.[fieldName] ?? {};

    const blockNonNumeric = (e: React.KeyboardEvent) => {
        if (e.key.length === 1 && !/[0-9.]/.test(e.key)) e.preventDefault();
    };

    const handleChange = (value: string, field: string) => {
        const newRow = { ...row, [field]: value };
        const newIncomeChargeable =
            (parseFloat(newRow.totalSalaryInc) || 0) - (parseFloat(newRow.deductionUnder16) || 0);
        setFieldValue(fieldName, {
            totalSalaryInc: newRow.totalSalaryInc,
            deductionUnder16: newRow.deductionUnder16,
            incomeChargableUnderSal: newIncomeChargeable,
        });
        onChange?.(newRow, newIncomeChargeable);
    };

    const incomeChargeable =
        (parseFloat(row.totalSalaryInc) || 0) - (parseFloat(row.deductionUnder16) || 0);

    // Keep Formik and parent in sync when row changes outside of keystroke
    // useEffect(() => {
    //     setFieldValue(fieldName, {
    //         totalSalaryInc: row.totalSalaryInc,
    //         deductionUnder16: row.deductionUnder16,
    //         incomeChargableUnderSal: incomeChargeable,
    //     });

    //     onChange?.(row, incomeChargeable);
    // }, [row, incomeChargeable, fieldName, onChange, setFieldValue]);

    const columns = [
        {
            title: <Text style={headerStyle}>Total Salary & Income (1)</Text>,
            dataIndex: 'totalSalaryInc',
            key: 'totalSalaryInc',
            render: (_: string, record: any) => (
                <Input
                    placeholder="Enter"
                    value={record.totalSalaryInc}
                    onKeyDown={blockNonNumeric}
                    onChange={e => handleChange(e.target.value, 'totalSalaryInc')}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Deductions under Section 16 (2)</Text>,
            dataIndex: 'deductionUnder16',
            key: 'deductionUnder16',
            render: (_: string, record: any) => (
                <Input
                    placeholder="Enter"
                    value={record.deductionUnder16}
                    onKeyDown={blockNonNumeric}
                    onChange={e => handleChange(e.target.value, 'deductionUnder16')}
                />
            ),
        },
        {
            title: <Text style={headerStyle}>Income Chargeable under Salaries</Text>,
            dataIndex: 'incomeChargableUnderSal',
            key: 'incomeChargableUnderSal',
            render: () => <Text strong>{incomeChargeable || ''}</Text>,
        },
    ];

    return (
        <Flex vertical className="mt-6">
            <Typography.Text className="font-semibold text-lg text-left">
                3. Income Chargeable under Salaries
                <p>
                    <Typography.Text className="font-light"> Formula (1 - 2)</Typography.Text>
                </p>
            </Typography.Text>
            <div className="w-full overflow-x-auto md:overflow-x-visible">
                <Table
                    columns={columns}
                    dataSource={[row]}
                    pagination={false}
                    bordered
                    scroll={isMobile ? { x: 920 } : undefined}
                />
            </div>
        </Flex>
    );
};

export default IncomeChargableAtSalary;
