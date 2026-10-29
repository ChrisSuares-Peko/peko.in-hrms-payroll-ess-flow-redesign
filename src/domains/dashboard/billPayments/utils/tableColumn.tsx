import { Dropdown, Flex, Input, Space, Switch, TableProps, Tag, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import MoreServicesIcon from '@domains/dashboard/Payroll/assets/icons/viewMore.svg';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Beneficiary } from '../types';

export const beneficiaryTableColumn = (
    dropdownVisible: Record<string, boolean>,
    onDropdownToggle: (key: any, visible: boolean) => void,
    handleEditClick: any
): TableProps<Beneficiary>['columns'] => [
    {
        title: (
            <Typography.Text className="text-xs text-gray-500 sm:text-xs text-nowrap">
                Beneficiary Name
            </Typography.Text>
        ),
        dataIndex: 'name',
        key: 'name',
        width: '40%',
        render: text => <Typography.Text className="text-xs sm:text-sm">{text}</Typography.Text>,
    },
    {
        title: (
            <Typography.Text className="text-xs text-gray-500 sm:text-xs">
                Consumer Number
            </Typography.Text>
        ),
        dataIndex: 'billerId',
        key: 'billerId',
        width: '20%',
        render: billerId => (
            <Tag bordered={false} className="rounded-xl">
                <Typography.Text className="text-xs sm:text-sm">{billerId}</Typography.Text>
            </Tag>
        ),
    },
    {
        title: (
            <Typography.Text className="text-xs text-gray-500 sm:text-xs">Action</Typography.Text>
        ),
        dataIndex: 'edit',
        key: 'edit',
        width: '20%',
        align: 'center',
        render: (_, record) => (
            <Space align="center">
                <Switch className="mb-1" size="small" />
            </Space>
        ),
    },
    {
        title: <Typography.Text className="text-xs text-gray-500 sm:text-xs">More</Typography.Text>,
        key: 'more',
        width: '40%',
        align: 'center',
        render: (_, record) => (
            <Space align="center">
                <Dropdown
                    menu={{
                        items: [
                            { key: '1', label: 'Edit', onClick: () => handleEditClick(record) },
                            {
                                key: '2',
                                label: 'Delete',
                                onClick: () => console.log('Delete clicked'),
                            },
                        ],
                    }}
                    placement="bottom"
                    open={dropdownVisible[record.id]}
                    onOpenChange={visible => onDropdownToggle(record.id, visible)}
                    trigger={['click']}
                    arrow
                >
                    <div
                        onClick={e => {
                            e.stopPropagation();
                            onDropdownToggle(record.id, !dropdownVisible[record.id]);
                        }}
                        onKeyDown={e => {
                            if (e.key === 'Enter' || e.key === ' ')
                                onDropdownToggle(record.id, !dropdownVisible[record.id]);
                        }}
                        tabIndex={0}
                        role="button"
                        aria-haspopup="true"
                        aria-expanded={dropdownVisible[record.id]}
                        className="cursor-pointer svg-primary-stroke"
                    >
                        <ReactSVG src={MoreServicesIcon} />
                    </div>
                </Dropdown>
            </Space>
        ),
    },
];

export const beneficiaryBalanceColumn = (
    screens: any,
    limitData?: any
): TableProps<any>['columns'] => {
    const columns: TableProps<any>['columns'] = [];
    // const handleKeyPress = (e: { charCode: any; keyCode: any; preventDefault: () => void }) => {
    //     const charCode = e.charCode || e.keyCode;
    //     if (charCode < 48 || charCode > 57) {
    //         e.preventDefault();
    //     }
    // };

    if (screens.xs) {
        columns.push(
            {
                title: (
                    <Typography.Text className="text-xs sm:text-base">
                        Beneficiary Name
                    </Typography.Text>
                ),
                dataIndex: 'beneficiaryName',
                key: 'beneficiaryName',
                width: '50%',
                render: (_, record) => (
                    <Flex vertical gap={10}>
                        <Typography.Text className="text-xs">{record.data.name}</Typography.Text>
                        <Typography.Text className="text-xs">
                            {record.data.accountNo}
                        </Typography.Text>
                        {limitData?.accessKey === 'etisalat_bill' && (
                            <Typography.Text className="text-xs">
                                {record.data.optional1 ?? ''}
                            </Typography.Text>
                        )}
                    </Flex>
                ),
            },
            {
                title: <Typography.Text className="text-xs">Bill Amount</Typography.Text>,
                dataIndex: 'billAmount',
                key: 'billAmount',
                width: '50%',
                render: (billAmount, record) =>
                    record.status ? (
                        <Flex vertical gap={10}>
                            <Input
                                value={10}
                                // onChange={e => {
                                //     const amount = formatNumber(e.target.value);
                                //     handleAmountChange(record.data.id, amount);
                                // }}
                                maxLength={
                                    limitData ? limitData.maxDenomination.toString().length : 5
                                }
                                className={`w-full md:w-2/3 xl:w-2/6 rounded'border-gray-300'}`}
                            />
                            {limitData && (
                                <Typography.Text className={`text-xs `}>
                                    Minimum: ₹{' '}
                                    {formatNumberWithLocalString(limitData?.minDenomination || 0)}{' '}
                                    Maximum: ₹
                                    {formatNumberWithLocalString(limitData.maxDenomination)}{' '}
                                </Typography.Text>
                            )}
                        </Flex>
                    ) : (
                        <Typography.Text>{record.message}</Typography.Text>
                    ),
            }
        );
    } else {
        columns.push(
            {
                title: 'Beneficiary Name',
                dataIndex: 'beneficiaryName',
                key: 'beneficiaryName',
                width: '20%',
                render: (_, record) => <Typography.Text>{record.data.name}</Typography.Text>,
            },
            {
                title: 'Consumer Number',
                dataIndex: 'accountNo',
                key: 'accountNo',
                width: '20%',
                render: (_, record) => record.data.accountNo,
            },
            {
                title: 'Service Type',
                dataIndex: 'serviceType',
                key: 'Electricity Bill',
                width: '20%',
                render: (_, record) => record.data.accountNo,
            }
        );
        columns.push({
            title: 'Bill Amount',
            dataIndex: 'billAmount',
            key: 'billAmount',
            width: '40%',
            render: (billAmount, record) =>
                record.status ? (
                    <Flex vertical gap={10}>
                        <Input
                            value={10}
                            // onChange={e => {
                            //     const amount = formatNumber(e.target.value);
                            //     handleAmountChange(record.data.id, amount);
                            // }}
                            // onKeyPress={handleKeyPress}
                            maxLength={limitData ? limitData.maxDenomination.toString().length : 5}
                            className={`w-full md:w-2/3 xl:w-2/6 rounded 'border-gray-300'}`}
                        />
                        {limitData && (
                            <Typography.Text className={`text-xs `}>
                                {` Min: ₹ ${formatNumberWithLocalString(limitData?.minDenomination || 0)} and Max: ₹ ${formatNumberWithLocalString(limitData?.maxDenomination || 0)}`}
                            </Typography.Text>
                        )}
                    </Flex>
                ) : (
                    <Typography.Text>{record.message}</Typography.Text>
                ),
        });
    }

    return columns;
};

export const navigateToServiceType = (serviceType: string) => {
    switch (serviceType) {
        case 'bbps_utility_electricity':
            return `${paths.dashboard.billPayments}/${paths.billPayments.electricity}`;
        case 'bbps_utility_lpg':
            return `${paths.dashboard.billPayments}/${paths.billPayments.lpg}`;
        case 'bbps_utility_broadband':
            return `${paths.dashboard.billPayments}/${paths.billPayments.broadband}`;
        case 'bbps_utility_pipedgas':
            return `${paths.dashboard.billPayments}/${paths.billPayments.pipedGas}`;
        case 'bbps_utility_cable':
            return `${paths.dashboard.billPayments}/${paths.billPayments.cable}`;
        case 'bbps_utility_dth':
            return `${paths.dashboard.billPayments}/${paths.billPayments.dth}`;
        case 'bbps_utility_fastag':
            return `${paths.dashboard.billPayments}/${paths.billPayments.fastag}`;
        case 'bbps_utility_water':
            return `${paths.dashboard.billPayments}/${paths.billPayments.water}`;
        case 'bbps_utility_education':
            return `${paths.dashboard.billPayments}/${paths.billPayments.education}`;
        case 'bbps_other_prepaidMeter':
            return `${paths.dashboard.billPayments}/${paths.billPayments.prepaidMeter}`;
        case 'bbps_telecom_postpaid':
            return `${paths.dashboard.mobileRecharge}/${paths.telecomPayments.postpaid}`;
        case 'bbps_telecom_otme':
            return `${paths.dashboard.mobileRecharge}/${paths.telecomPayments.test}`;
        default:
            return paths.dashboard.billPayments;
    }
};
