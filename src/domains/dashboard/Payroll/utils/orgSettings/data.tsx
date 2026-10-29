import { DeleteOutlined, EditOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Space, Button, TableProps, Flex, Tooltip } from 'antd';

const formatText = (text: string | number) => {
    if (!text) return '';
    const stringText = String(text); // Convert input to string
    // Replace underscores with spaces
    const textWithSpaces = stringText.replace(/_/g, ' ');
    // Capitalize first letter and lowercase the rest
    return textWithSpaces.charAt(0).toUpperCase() + textWithSpaces.slice(1).toLowerCase();
};

export const convertText = (text: string): string =>
    text
        .split('_') // Split the text by underscore
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalize the first letter of each word
        .join(' '); // Join the words back with spaces
export const salaryCompColumn = (
    handleEdit: (id: any) => void,
    handleDelete: (id: any) => void,
    calculationBasedOnMap: Record<string, string> = {}
): TableProps<any>['columns'] => [
    {
        title: 'Component Name',
        dataIndex: 'componentName',
        render: (componentName, record) => (
            <Flex align="center" gap={6}>
                <span>{componentName}</span>
                {record.calculationType === 'BALANCING' && (
                    <Tooltip title="This is a balancing component - it automatically absorbs whatever remains of the gross salary after Basic, HRA and all fixed allowances are applied. You don't set an amount; it adjusts on its own for each employee so the components always add up exactly to their salary.">
                        <InfoCircleOutlined style={{ color: '#94A3B8' }} />
                    </Tooltip>
                )}
            </Flex>
        ),
    },

    {
        title: 'Calculation Type',
        dataIndex: 'calculationType',
        render: calculationType => formatText(calculationType),
    },
    {
        title: 'Amount/Percentage',
        key: 'amountOrPercentage',
        render: (text, record) => {
            if (record.calculationType === 'FIXED') {
                const amount = record.amountPercentage || 0;
                return new Intl.NumberFormat('en-IN', {
                    style: 'currency',
                    currency: 'INR',
                })
                    .format(amount)
                    .replace('₹', '₹ ');
            }
            if (record.calculationType === 'PERCENTAGE') {
                if (record.calculationBasis === 'BASIC_SALARY') {
                    return record.amountPercentage
                        ? `${record.amountPercentage}% of Basic Salary`
                        : '0';
                }
                if (record.calculationBasis === 'GROSS_SALARY') {
                    return record.amountPercentage
                        ? `${record.amountPercentage}% of Gross Salary`
                        : '0';
                }
                if (record.calculationBasis === 'CTC') {
                    return record.amountPercentage ? `${record.amountPercentage}% of CTC` : '0';
                }
                const baseLabel = calculationBasedOnMap[record.calculationBasedOn] || '';
                return record.amountPercentage
                    ? `${record.amountPercentage}% of ${formatText(baseLabel)}`
                    : '0';
            }
            if (record.calculationType === 'BALANCING') {
                return 'Balancing';
            }
            return '0';
        },
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            let colorClass = '';

            if (status === 'ACTIVE') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'INACTIVE') {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            }

            const formattedStatus = formatText(status);

            return (
                <span className={`${colorClass} font-normal px-3 py-1 rounded-2xl -ml-[.125rem]`}>
                    {formattedStatus}
                </span>
            );
        },
    },
    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: '10%',
        className: 'ant-table-tbody-ant-table-cell',
        render: (text, record: any) => {
            // Check if the component amount is 0
            const isAmountZero = record.amount === 0;

            return isAmountZero ? (
                <Flex justify="center" className="px-2">
                    <Button
                        type="default"
                        danger
                        className="w-full"
                        size="small"
                        onClick={() => handleEdit(record)}
                    >
                        Update
                    </Button>
                </Flex>
            ) : (
                <Space size="middle">
                    <Button className="border-0" onClick={() => handleEdit(record)}>
                        <EditOutlined className="text-[#E30000]" />
                    </Button>
                    {record.componentName !== 'Basic Salary' &&
                        record.componentName !== 'House Rent Allowance' &&
                        record.calculationType !== 'BALANCING' && (
                            <Button className="border-0" onClick={() => handleDelete(record)}>
                                <DeleteOutlined className="text-[#E30000]" />
                            </Button>
                        )}
                </Space>
            );
        },
    },
];

export const salaryCompCategories = [
    {
        label: 'Salary',
        value: 'SALARY',
    },
    {
        label: 'Bonus',
        value: 'BONUS',
    },
    {
        label: 'Allowance',
        value: 'ALLOWANCE',
    },
];

export const salaryAmountCategories = [
    {
        label: 'Fixed',
        value: 'FIXED',
    },
    {
        label: 'Percentage',
        value: 'PERCENTAGE',
    },
    {
        label: 'Balancing',
        value: 'BALANCING',
    },
];

// Calculation basis for PERCENTAGE-type Salary Components — mirrors deductionTypes below.
export const salaryCalculationBasis = [
    {
        label: 'Specific Component',
        value: 'COMPONENT',
    },
    {
        label: '% of Basic Salary',
        value: 'BASIC_SALARY',
    },
    {
        label: '% of Gross Salary',
        value: 'GROSS_SALARY',
    },
    {
        label: '% of CTC',
        value: 'CTC',
    },
];

// Restricted basis options shown when the component being edited is "Basic Salary" itself —
// it can only be a percentage of Gross or of CTC (not of a specific component, and not of
// its own Basic).
export const basicSalaryCalculationBasis = [
    {
        label: '% of Gross Salary',
        value: 'GROSS_SALARY',
    },
    {
        label: '% of CTC',
        value: 'CTC',
    },
];

export const salaryCalculationFrequency = [
    {
        label: 'Monthly',
        value: 'MONTHLY',
    },
    {
        label: 'Annually',
        value: 'ANNUALLY',
    },
];

export const salaryCompStatus = [
    {
        label: 'Active',
        value: 'ACTIVE',
    },
    {
        label: 'Inactive',
        value: 'INACTIVE',
    },
];

export const deductionCompColumn = (
    handleEdit: (id: any) => void,
    handleDelete: (id: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Deduction Name',
        dataIndex: 'deductionName',
    },
    {
        title: 'Calculation Type',
        dataIndex: 'calculationType',
        render: calculationType => formatText(calculationType),
    },
    {
        title: 'Amount/Percentage',
        key: 'amountOrPercentage',
        render: (text, record) => {
            if (record.calculationType === 'FIXED') {
                return record.amountPercentage ? `${record.amountPercentage}` : '-';
            }
            if (record.calculationType === 'PERCENTAGE') {
                return record.amountPercentage
                    ? `${record.amountPercentage}% of ${record.salaryDeductionType
                          .split('_')
                          .map(
                              (word: string) =>
                                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                          )
                          .join(' ')}`
                    : '-';
            }
            return '0';
        },
    },
    {
        title: 'Status',
        dataIndex: 'status',
        key: 'status',
        render: status => {
            let colorClass = '';

            if (status === 'ACTIVE') {
                colorClass = 'text-[#05BE63] bg-[#DDFFE2]';
            } else if (status === 'INACTIVE') {
                colorClass = 'text-[#FDA700] bg-[#FFFBE4]';
            }

            const formattedStatus = formatText(status);

            return (
                <span className={`${colorClass} font-normal px-3 py-1 rounded-2xl -ml-[.125rem]`}>
                    {formattedStatus}
                </span>
            );
        },
    },
    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        width: '5%',
        render: (text, record: any) => (
            <Space size="middle">
                {record.deductionName !== 'Provident Fund (PF)' && (
                    <Button className="border-0" onClick={() => handleDelete(record)}>
                        <DeleteOutlined className="text-[#E30000]" />
                    </Button>
                )}
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];

// Deduction Calculation Types
export const deductionAmountCategories = [
    {
        label: 'Fixed',
        value: 'FIXED',
    },
    {
        label: 'Percentage',
        value: 'PERCENTAGE',
    },
];

// Deduction Calculation Basis
export const deductionCalculationBasis = [
    {
        label: 'Monthly',
        value: 'MONTHLY',
    },
    {
        label: 'Yearly',
        value: 'YEARLY',
    },
];
export const deductionTypes = [
    {
        label: 'Basic Salary',
        value: 'BASIC_SALARY',
    },
    {
        label: 'Gross Salary',
        value: 'GROSS_SALARY',
    },
];
// Deduction Status Options
export const deductionCompStatus = [
    {
        label: 'Active',
        value: 'ACTIVE',
    },
    {
        label: 'Inactive',
        value: 'INACTIVE',
    },
];

export const leaveColumns = (
    handleEdit: (id: any) => void,
    handleDelete: (id: any) => void
): TableProps<any>['columns'] => [
    {
        title: 'Leave Type',
        dataIndex: 'leaveType',
        render: leaveType => formatText(leaveType),
    },
    {
        title: 'Accrual Type',
        dataIndex: 'accrualType',
        render: accrualType => formatText(accrualType),
    },
    {
        title: 'Accrual Rate',
        dataIndex: 'accrualRate',
        render: accrualRate =>
            accrualRate && accrualRate.trim() !== 'N/A' && accrualRate.trim() !== ''
                ? `${accrualRate} days/month`
                : 'N/A',
    },
    {
        title: 'Maximum Accrual',
        dataIndex: 'maximumAccrual',
        render: maximumAccrual =>
            maximumAccrual && maximumAccrual.trim() !== ''
                ? `${maximumAccrual > 1 ? `${maximumAccrual} days` : `${maximumAccrual} day`}`
                : 'N/A',
    },
    {
        title: 'Leave Balance Carryover',
        dataIndex: 'leaveBalanceCarryover',
        render: leaveBalanceCarryover => formatText(leaveBalanceCarryover),
    },
    {
        title: 'Maximum No. of Leaves',
        dataIndex: 'maximumNumberOfLeaves',
        render: maximumNumberOfLeaves =>
            maximumNumberOfLeaves !== '' && maximumNumberOfLeaves !== null
                ? `${maximumNumberOfLeaves} ${Number(maximumNumberOfLeaves) > 1 ? 'days' : 'day'}`
                : 'N/A',
    },
    {
        title: 'Applicable Gender',
        dataIndex: 'applicableGender',
        render: applicableGender => formatText(applicableGender || 'ALL'),
    },

    {
        title: 'Action',
        dataIndex: 'action',
        key: 'action',
        render: (text, record: any) => (
            <Space size="middle">
                <Button className="border-0" onClick={() => handleDelete(record)}>
                    <DeleteOutlined className="text-[#E30000]" />
                </Button>
                <Button className="border-0" onClick={() => handleEdit(record)}>
                    <EditOutlined className="text-[#E30000]" />
                </Button>
            </Space>
        ),
    },
];
export const leaveAccrualTypes = [
    { label: 'Monthly', value: 'MONTHLY' },
    { label: 'Fixed', value: 'FIXED' },
    { label: 'Daily', value: 'DAILY' },
    { label: 'Yearly', value: 'YEARLY' }, // added as per suggestion
];
export const leaveCarryOverOptions = [
    { label: 'Allowed', value: 'ALLOWED' },
    { label: 'Not Allowed', value: 'NOT_ALLOWED' },
];
export const applicableGenderOptions = [
    { label: 'All', value: 'ALL' },
    { label: 'Male', value: 'MALE' },
    { label: 'Female', value: 'FEMALE' },
];
