import { EditOutlined, ExclamationCircleFilled } from '@ant-design/icons';
import { Button, Flex, Popover, Skeleton, Switch, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';
import { formatNumberWithLocalStringWithoutDecimalPoint } from '@utils/priceFormat';

import {
    FilterType,
    PaymentMethod,
    PaymentMethodFilterKey,
    SelectOption,
} from '../../types/paymentMethods';
import {
    CORPORATE_CARD_METHOD_FILTER,
    getMethodFilterValue,
    getPartnerLabel,
    getPaymentMethodName,
    PAYMENT_METHOD_KIND_LABELS,
    PAYMENT_METHOD_LIMIT_FIELDS,
    STATUS_FILTER_OPTIONS,
    toLimitAmount,
    WALLET_METHOD_FILTER,
} from '../../utils/paymentMethods';

const { Text } = Typography;

type ColumnsProps = {
    filters: Pick<FilterType, PaymentMethodFilterKey>;
    partnerOptions: SelectOption[];
    gatewayOptions: SelectOption[];
    serviceNameById: Map<number, string>;
    servicesLoading: boolean;
    updatingId: number | null;
    onStatusChange: (record: PaymentMethod, isActive: boolean) => void;
    onEdit: (record: PaymentMethod) => void;
};

const MethodCell = ({ record }: { record: PaymentMethod }) => {
    const isGateway = record.paymentMethod === 'PAYMENT_GATEWAY';
    const isGatewayMissing = isGateway && !record.pgProviderName;

    return (
        <Flex vertical>
            {isGatewayMissing ? (
                <Tooltip title="Edit this payment method to choose its gateway.">
                    <Flex align="center" gap={6}>
                        <ExclamationCircleFilled className="text-warning" />
                        <Text className="text-sm font-medium text-textHeadings">
                            Gateway not set
                        </Text>
                    </Flex>
                </Tooltip>
            ) : (
                <Text className="text-sm font-medium text-textHeadings">
                    {getPaymentMethodName(record)}
                </Text>
            )}
            <Text className="text-xs text-textGreyColor">
                {PAYMENT_METHOD_KIND_LABELS[record.paymentMethod]}
            </Text>
        </Flex>
    );
};

const toColumnFilters = (options: SelectOption[]) =>
    options.map(({ value, label }) => ({ text: label, value }));

type ServicesCellProps = {
    serviceIds: number[];
    serviceNameById: Map<number, string>;
    isLoading: boolean;
};

const ServicesCell = ({ serviceIds, serviceNameById, isLoading }: ServicesCellProps) => {
    if (!serviceIds.length) {
        return (
            <Flex align="center" gap={6}>
                <ExclamationCircleFilled className="text-warning" />
                <Text className="text-sm text-textBody">No services</Text>
            </Flex>
        );
    }

    const label = `${serviceIds.length} ${serviceIds.length === 1 ? 'service' : 'services'}`;
    const services = serviceIds
        .map(serviceId => ({
            serviceId,
            name: serviceNameById.get(serviceId) ?? `Service #${serviceId}`,
        }))
        .sort((first, second) => first.name.localeCompare(second.name));

    return (
        <Popover
            trigger={['hover', 'click']}
            placement="bottomLeft"
            title={label}
            content={
                isLoading ? (
                    <Skeleton active title={false} paragraph={{ rows: 3 }} className="w-48" />
                ) : (
                    <Flex vertical gap={6} className="max-h-60 w-56 overflow-y-auto pr-1">
                        {services.map(({ serviceId, name }) => (
                            <Text key={serviceId} className="text-sm text-textBody">
                                {name}
                            </Text>
                        ))}
                    </Flex>
                )
            }
        >
            <Button type="link" size="small" className="h-auto p-0 font-medium">
                {label}
            </Button>
        </Popover>
    );
};

const LimitsCell = ({ limits }: { limits: PaymentMethod['limits'] }) => {
    const amounts = PAYMENT_METHOD_LIMIT_FIELDS.map(field => ({
        ...field,
        amount: toLimitAmount(limits?.[field.key]),
    }));

    if (amounts.every(({ amount }) => !amount)) {
        return <Text className="text-sm text-textGreyColor">No limits</Text>;
    }

    return (
        <Flex vertical gap={2} className="max-w-56">
            {amounts.map(({ key, shortLabel, amount }) => (
                <Flex key={key} justify="space-between" gap={12}>
                    <Text className="text-xs text-textGreyColor">{shortLabel}</Text>
                    <Text
                        className={`text-xs ${
                            amount ? 'font-medium text-textHeadings' : 'text-textGreyColor'
                        }`}
                    >
                        {amount
                            ? `₹ ${formatNumberWithLocalStringWithoutDecimalPoint(amount)}`
                            : 'No limit'}
                    </Text>
                </Flex>
            ))}
        </Flex>
    );
};

const getPaymentMethodColumns = ({
    filters,
    partnerOptions,
    gatewayOptions,
    serviceNameById,
    servicesLoading,
    updatingId,
    onStatusChange,
    onEdit,
}: ColumnsProps): ColumnsType<PaymentMethod> => {
    const methodFilterValue = getMethodFilterValue(filters);

    return [
        {
            title: 'Payment method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
            sorter: true,
            width: 200,
            filters: [
                { text: 'Wallet', value: WALLET_METHOD_FILTER },
                { text: 'Corporate card', value: CORPORATE_CARD_METHOD_FILTER },
                ...toColumnFilters(gatewayOptions),
            ],
            filterMultiple: false,
            filteredValue: methodFilterValue ? [methodFilterValue] : null,
            render: (_: PaymentMethod['paymentMethod'], record: PaymentMethod) => (
                <MethodCell record={record} />
            ),
        },
        {
            title: 'Partner',
            dataIndex: 'name',
            key: 'name',
            sorter: true,
            width: 200,
            filters: toColumnFilters(partnerOptions),
            filterSearch: true,
            filterMultiple: false,
            filteredValue: filters.partnerId ? [filters.partnerId] : null,
            render: (_: PaymentMethod['name'], record: PaymentMethod) => (
                <Text className="text-sm text-textHeadings">{getPartnerLabel(record)}</Text>
            ),
        },
        {
            title: 'Services',
            dataIndex: 'serviceList',
            key: 'serviceList',
            width: 140,
            render: (serviceList: number[]) => (
                <ServicesCell
                    serviceIds={serviceList}
                    serviceNameById={serviceNameById}
                    isLoading={servicesLoading}
                />
            ),
        },
        {
            title: 'Limits',
            dataIndex: 'limits',
            key: 'limits',
            width: 220,
            render: (limits: PaymentMethod['limits']) => <LimitsCell limits={limits} />,
        },
        {
            title: 'Status',
            dataIndex: 'isActive',
            key: 'isActive',
            width: 150,
            filters: toColumnFilters(STATUS_FILTER_OPTIONS),
            filterMultiple: false,
            filteredValue: filters.isActive ? [filters.isActive] : null,
            render: (isActive: boolean, record: PaymentMethod) => (
                <Flex align="center" gap={8}>
                    <Switch
                        checked={isActive}
                        size="small"
                        loading={updatingId === record.id}
                        disabled={updatingId !== null}
                        onChange={checked => onStatusChange(record, checked)}
                        aria-label={`${isActive ? 'Disable' : 'Enable'} ${getPaymentMethodName(
                            record
                        )} for ${getPartnerLabel(record)}`}
                    />
                    <Text className={`text-sm ${isActive ? 'text-success' : 'text-textGreyColor'}`}>
                        {isActive ? 'Active' : 'Inactive'}
                    </Text>
                </Flex>
            ),
        },
        {
            title: 'Added on',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: true,
            width: 170,
            render: (createdAt: string) => (
                <Flex vertical>
                    <Text className="text-sm text-textHeadings">
                        {formattedDateOnly(new Date(createdAt))}
                    </Text>
                    <Text className="text-xs text-textGreyColor">
                        {formattedTime(new Date(createdAt))}
                    </Text>
                </Flex>
            ),
        },
        {
            title: 'Actions',
            key: 'actions',
            width: 110,
            render: (_: unknown, record: PaymentMethod) => (
                <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => onEdit(record)}
                    aria-label={`Edit ${getPaymentMethodName(record)} for ${getPartnerLabel(record)}`}
                >
                    Edit
                </Button>
            ),
        },
    ];
};

export default getPaymentMethodColumns;
