import { useEffect, useRef, useState } from 'react';

import { DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Divider,
    Flex,
    InputNumber,
    Popover,
    Row,
    Select,
    Table,
    Tag,
    Typography,
} from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

import { updateCartItemDetails } from '../api/index';
import useServiceCart from '../hooks/useServiceCart';
import { CartItem } from '../types/index';

const { Title, Text } = Typography;

const tableComponents = {
    header: {
        cell: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
            <th
                {...props}
                className="bg-tableHeaderBg text-tableHeaderText"
                style={{
                    ...props.style,
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '10px 24px',
                }}
            />
        ),
    },
    body: {
        cell: (props: React.HTMLAttributes<HTMLTableCellElement>) => (
            <td {...props} style={{ ...props.style, paddingLeft: '24px', paddingRight: '24px' }} />
        ),
    },
};

const sectionCardClassName =
    'mb-6 overflow-hidden rounded-[20px] border border-borderCard shadow-none';
const sideCardClassName = 'rounded-[20px] border border-borderCard shadow-none';
const sectionCardBodyStyle = { padding: 0 };
const sideCardBodyStyle = { padding: 20 };
const sectionHeaderClassName = 'border-b border-borderDivider';
const sectionHeaderStyle = {
    marginBottom: 0,
    padding: '14px 18px',
};

const tenureLabel = (months: number): string => {
    if (months < 12) return `${months} Month${months > 1 ? 's' : ''}`;
    if (months === 12) return '1 Year';
    return `${months / 12} Years`;
};

const tenureColumnValue = (months?: number): string => {
    if (!months) return '-';
    return tenureLabel(months);
};

const getCartItemRowKey = (record: CartItem) =>
    `${record.productId}-${record.planId ?? 'no-plan'}-${record.billingCycle ?? 'no-cycle'}`;
const getWorkspaceSeats = (record: CartItem) => record.seats ?? record.productQuantity ?? 1;
const getEmailAccounts = (record: CartItem) => record.accounts ?? record.productQuantity ?? 1;

const CartPage = () => {
    const navigate = useNavigate();
    const { fetchCart, handleRemoveFromCart } = useServiceCart();
    const cartData = useAppSelector(state => state.reducer.domainHosting.cartData);
    const { id, role } = useAppSelector(state => state.reducer.auth);

    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const hasTrackedCartViewedRef = useRef(false);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const items: CartItem[] = cartData?.items ?? [];

    const domainItems = items.filter(i => i.itemType === 'domain');
    const vpsItems = items.filter(i => i.itemType === 'vps_server');
    const backupItems = items.filter(i => i.itemType === 'backup');
    const sharedHostingItems = items.filter(i => i.itemType === 'shared_hosting');
    const unavailableItems = items.filter(i => i.itemType === 'hosting');
    const emailItems = items.filter(i => i.itemType === 'titan_email');
    const workspaceItems = items.filter(i => i.itemType === 'google_workspace');

    const total = parseFloat((cartData?.itemsTotalAmount ?? 0).toFixed(2));

    // Fires once, the first time the cart finishes loading — not on every subsequent
    // cart mutation (billing cycle change, item removal, etc. all re-fetch cartData).
    useEffect(() => {
        if (!cartData || hasTrackedCartViewedRef.current) return;
        hasTrackedCartViewedRef.current = true;
        // PROTOTYPE-SETUP: MoEngage analytics call removed (SDK stripped).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cartData]);

    const updateDetails = async (
        productId: string,
        planId: string | undefined,
        currentBillingCycle: number | undefined,
        patch: { accounts?: number; seats?: number; billingCycle?: number },
        productName?: string | null
    ) => {
        const key = `${productId}-${planId ?? ''}-${currentBillingCycle ?? ''}`;
        setUpdatingId(key);
        await updateCartItemDetails({
            userId: id,
            userType: role,
            productId,
            planId: planId ?? null,
            productName: productName ?? null,
            billingCycle: patch.billingCycle ?? currentBillingCycle,
            ...patch,
        });
        await fetchCart();
        setUpdatingId(null);
    };

    const makeActionCol = (itemType?: string) => ({
        title: 'ACTION',
        key: 'action',
        render: (_: any, record: CartItem) => (
            <DeleteOutlined
                className="text-gray-600 hover:text-brandSecondary cursor-pointer text-lg"
                onClick={() =>
                    handleRemoveFromCart(record.productId, record.planId, record.billingCycle, record.productName, itemType ?? record.itemType)
                }
            />
        ),
    });

    const actionCol = makeActionCol();

    const unavailableColumns = [
        { title: 'SL.NO', key: 'sl', width: 70, render: (_: any, __: any, i: number) => i + 1 },
        {
            title: 'PRODUCT',
            key: 'product',
            render: (_: any, record: CartItem) => (
                <Flex align="center" gap={8}>
                    <Text delete className="text-gray-400">
                        {record.productName}
                    </Text>
                    <Text className="text-red-400 text-xs">Not available</Text>
                </Flex>
            ),
        },
        actionCol,
    ];

    const domainColumns = [
        { title: 'SL.NO', key: 'sl', width: 70, render: (_: any, __: any, i: number) => i + 1 },
        {
            title: 'DOMAIN NAME',
            key: 'productName',
            render: (_: any, record: CartItem) => <Text strong>{record.productName}</Text>,
        },
        {
            title: 'REGISTRATION PERIOD',
            key: 'years',
            render: (_: any, record: CartItem) => {
                const key = `${record.productId}-${record.planId ?? ''}-${record.billingCycle ?? ''}`;
                const oneYearPrice = (record.validYears ?? []).find(y => y.years === 1)?.price ?? record.unitPrice ?? 0;
                const options = (record.validYears ?? []).map(y => {
                    const domainTotal = y.years * y.price;
                    const baseTotal = y.years * oneYearPrice;
                    const discountPct = y.years > 1 && baseTotal > 0
                        ? Math.round((1 - domainTotal / baseTotal) * 100)
                        : 0;
                    return { value: y.years, label: `${y.years} Year${y.years > 1 ? 's' : ''}`, domainTotal, discountPct };
                });
                return (
                    <Select
                        value={record.billingCycle ?? 1}
                        options={options}
                        loading={updatingId === key}
                        disabled={updatingId === key || options.length === 0}
                        style={{ width: 200 }}
                        optionRender={option => (
                            <Flex justify="space-between" align="center" gap={8}>
                                <span>
                                    {option.data.label}
                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
                                        ₹{(option.data.domainTotal as number).toFixed(2)}
                                    </Text>
                                </span>
                                {(option.data.discountPct as number) > 0 && (
                                    <Tag
                                        className="bg-savingsTagGreen border-savingsTagGreen text-white"
                                        style={{
                                            fontSize: 11,
                                            margin: 0,
                                        }}
                                    >
                                        {option.data.discountPct}% off
                                    </Tag>
                                )}
                            </Flex>
                        )}
                        onChange={val =>
                            updateDetails(record.productId, record.planId, record.billingCycle, {
                                billingCycle: val,
                            }, record.productName)
                        }
                    />
                );
            },
        },
        {
            title: 'TOTAL',
            key: 'total',
            render: (_: any, record: CartItem) => {
                // Use backend-calculated totalPrice instead of recalculating
                const years = record.billingCycle ?? 1;
                const pricePerYear = record.unitPrice ?? 0;
                const itemTotal = record.totalPrice ?? 0;
                const oneYearPrice = (record.validYears ?? []).find(y => y.years === 1)?.price ?? pricePerYear;
                const baseTotal = years * oneYearPrice;
                const savings = baseTotal - itemTotal;
                return (
                    <div>
                        <Text strong>₹ {itemTotal.toFixed(2)}</Text>
                        <Text className="text-gray-400 text-xs block">
                            ₹{pricePerYear.toFixed(2)}/yr × {years} yr{years > 1 ? 's' : ''}
                        </Text>
                        {savings > 0 && (
                            <Text className="text-savingsTagGreen" style={{ fontSize: 11 }}>
                                Save ₹{savings.toFixed(2)}
                            </Text>
                        )}
                    </div>
                );
            },
        },
        actionCol,
    ];

    const makeHostingColumns = (itemType?: string) => [
        { title: 'SL.NO', key: 'sl', width: 70, render: (_: any, __: any, i: number) => i + 1 },
        {
            title: 'PRODUCT',
            key: 'product',
            render: (_: any, record: CartItem) => (
                <Flex align="center" gap={6}>
                    <Text strong>{record.productName}</Text>
                    {record.addons?.length ? (
                        <Popover
                            title="Add-ons"
                            trigger="hover"
                            content={
                                <div style={{ minWidth: 200 }}>
                                    {record.addons.map(addon => (
                                        <Flex
                                            key={addon}
                                            justify="space-between"
                                            gap={16}
                                            style={{ marginBottom: 4 }}
                                        >
                                            <Text style={{ fontSize: 13 }}>
                                                {addon.toUpperCase()}
                                            </Text>
                                            <Text style={{ fontSize: 13, color: '#6B7280' }}>
                                                {record.availableAddons?.[addon] != null
                                                    ? `₹${record.availableAddons[addon].toFixed(2)}/mo`
                                                    : '—'}
                                            </Text>
                                        </Flex>
                                    ))}
                                </div>
                            }
                        >
                            <InfoCircleOutlined
                                style={{ color: '#9CA3AF', cursor: 'pointer', fontSize: 14 }}
                            />
                        </Popover>
                    ) : null}
                </Flex>
            ),
        },
        {
            title: 'YEARS',
            key: 'billingCycle',
            render: (_: any, record: CartItem) => {
                const key = `${record.productId}-${record.planId ?? ''}-${record.billingCycle ?? ''}`;
                return (
                    <Select
                        value={record.billingCycle ?? 1}
                        options={(record.validBillingCycles ?? []).map(c => ({
                            value: c.months,
                            label: tenureColumnValue(c.months),
                        }))}
                        loading={updatingId === key}
                        disabled={updatingId === key}
                        className="w-32"
                        onChange={val =>
                            updateDetails(record.productId, record.planId, record.billingCycle, {
                                billingCycle: val,
                            })
                        }
                    />
                );
            },
        },
        {
            title: 'TOTAL',
            key: 'total',
            render: (_: any, record: CartItem) => {
                // Use backend-calculated totalPrice instead of recalculating
                const itemTotal = record.totalPrice ?? 0;
                const addon = record.addonUnitPrice ?? 0;
                const cycle = record.billingCycle ?? 1;
                return (
                    <div>
                        <Text strong>₹ {itemTotal.toFixed(2)}</Text>
                        {addon > 0 && (
                            <Text className="text-gray-400 text-xs block">
                                incl. ₹ {(addon * cycle).toFixed(2)} add-ons
                            </Text>
                        )}
                    </div>
                );
            },
        },
        makeActionCol(itemType),
    ];

    const hostingColumns = makeHostingColumns();

    const emailColumns = [
        { title: 'SL.NO', key: 'sl', width: 70, render: (_: any, __: any, i: number) => i + 1 },
        {
            title: 'PRODUCT',
            key: 'productName',
            render: (_: any, record: CartItem) => <Text strong>{record.productName}</Text>,
        },
        {
            title: 'No. Of EMAILS',
            key: 'accounts',
            render: (_: any, record: CartItem) => {
                const key = `${record.productId}-${record.planId ?? ''}-${record.billingCycle ?? ''}`;
                return (
                    <InputNumber
                        min={1}
                        value={getEmailAccounts(record)}
                        disabled={updatingId === key}
                        onChange={val => {
                            if (!val) return;
                            updateDetails(record.productId, record.planId, record.billingCycle, {
                                accounts: val,
                            });
                        }}
                    />
                );
            },
        },
        {
            title: 'TENURE',
            key: 'billingCycle',
            render: (_: any, record: CartItem) => {
                const key = `${record.productId}-${record.planId ?? ''}-${record.billingCycle ?? ''}`;
                return (
                    <Select
                        value={record.billingCycle ?? 1}
                        options={(record.validBillingCycles ?? []).map(c => ({
                            value: c.months,
                            label: tenureLabel(c.months),
                        }))}
                        loading={updatingId === key}
                        disabled={updatingId === key || (record.validBillingCycles ?? []).length === 0}
                        className="w-32"
                        onChange={val =>
                            updateDetails(record.productId, record.planId, record.billingCycle, {
                                billingCycle: val,
                            })
                        }
                    />
                );
            },
        },
        {
            title: 'TOTAL',
            key: 'total',
            render: (_: any, record: CartItem) => {
                // Use backend-calculated totalPrice instead of recalculating
                const accounts = getEmailAccounts(record);
                const months = record.billingCycle ?? 1;
                const pricePerMonth = record.unitPrice ?? 0;
                const itemTotal = record.totalPrice ?? 0;
                return (
                    <div>
                        <Text strong>₹ {itemTotal.toFixed(2)}</Text>
                        <Text className="text-gray-400 text-xs block">
                            ₹{pricePerMonth.toFixed(2)}/mo × {accounts} acct{accounts > 1 ? 's' : ''} × {tenureLabel(months)}
                        </Text>
                    </div>
                );
            },
        },
        actionCol,
    ];

    const workspaceColumns = [
        { title: 'SL.NO', key: 'sl', width: 70, render: (_: any, __: any, i: number) => i + 1 },
        {
            title: 'PRODUCT',
            key: 'productName',
            render: (_: any, record: CartItem) => <Text strong>{record.productName}</Text>,
        },
        {
            title: 'SEATS',
            key: 'seats',
            render: (_: any, record: CartItem) => {
                const key = `${record.productId}-${record.planId ?? ''}-${record.billingCycle ?? ''}`;
                return (
                    <InputNumber
                        min={1}
                        value={getWorkspaceSeats(record)}
                        disabled={updatingId === key}
                        onChange={val => {
                            if (!val) return;
                            updateDetails(record.productId, record.planId, record.billingCycle, {
                                seats: val,
                            });
                        }}
                    />
                );
            },
        },
        {
            title: 'TENURE',
            key: 'billingCycle',
            render: (_: any, record: CartItem) => {
                const key = `${record.productId}-${record.planId ?? ''}-${record.billingCycle ?? ''}`;
                return (
                    <Select
                        value={record.billingCycle ?? 1}
                        options={(record.validBillingCycles ?? []).map(c => ({
                            value: c.months,
                            label: tenureLabel(c.months),
                        }))}
                        loading={updatingId === key}
                        disabled={updatingId === key || (record.validBillingCycles ?? []).length === 0}
                        className="w-32"
                        onChange={val =>
                            updateDetails(record.productId, record.planId, record.billingCycle, {
                                billingCycle: val,
                            })
                        }
                    />
                );
            },
        },
        {
            title: 'TOTAL',
            key: 'total',
            render: (_: any, record: CartItem) => {
                // Use backend-calculated totalPrice instead of recalculating
                const seats = getWorkspaceSeats(record);
                const months = record.billingCycle ?? 1;
                const pricePerMonth = record.unitPrice ?? 0;
                const itemTotal = record.totalPrice ?? 0;
                return (
                    <div>
                        <Text strong>₹ {itemTotal.toFixed(2)}</Text>
                        <Text className="text-gray-400 text-xs block">
                            ₹{pricePerMonth.toFixed(2)}/mo × {seats} seat{seats > 1 ? 's' : ''} × {tenureLabel(months)}
                        </Text>
                    </div>
                );
            },
        },
        actionCol,
    ];

    const renderSectionCard = (
        title: string | null,
        columns: any[],
        dataSource: CartItem[],
        rowKey: string | ((record: CartItem) => string) = getCartItemRowKey
    ) => (
        <Card className={sectionCardClassName} styles={{ body: sectionCardBodyStyle }}>
            {title ? (
                <div className={sectionHeaderClassName} style={sectionHeaderStyle}>
                    <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                        {title}
                    </Title>
                </div>
            ) : null}
            <Table
                columns={columns}
                dataSource={dataSource}
                rowKey={rowKey}
                pagination={false}
                components={tableComponents}
                scroll={{ x: 'max-content' }}
            />
        </Card>
    );

    return (
        <Content className="min-h-screen bg-white px-6 py-8 lg:px-8">
            <div className="mx-auto w-full max-w-[1280px]">
                <div className="mb-6">
                    <Title level={3} style={{ margin: 0, fontWeight: 600 }}>
                        Cart
                    </Title>
                </div>

                <Row gutter={[24, 24]} align="top">
                    {/* LEFT */}
                    <Col xs={24} lg={16}>
                        {domainItems.length > 0 &&
                            renderSectionCard('Domain', domainColumns, domainItems)}

                        {vpsItems.length > 0 && (
                            <Card className={sectionCardClassName} styles={{ body: sectionCardBodyStyle }}>
                                <div className={sectionHeaderClassName} style={sectionHeaderStyle}>
                                    <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                                        VPS Server
                                    </Title>
                                </div>
                                <Table
                                    columns={makeHostingColumns('vps_server')}
                                    dataSource={vpsItems}
                                    rowKey={getCartItemRowKey}
                                    pagination={false}
                                    components={tableComponents}
                                    scroll={{ x: 'max-content' }}
                                    expandable={{
                                        expandedRowKeys: vpsItems
                                            .filter(v => backupItems.some(b => b.vpsProductId === v.productId))
                                            .map(getCartItemRowKey),
                                        showExpandColumn: false,
                                        expandedRowRender: (vpsRecord: CartItem) => {
                                            const backup = backupItems.find(b => b.vpsProductId === vpsRecord.productId);
                                            if (!backup) return null;
                                            const gb = backup.storageInGb ?? 0;
                                            const months = backup.billingCycle ?? 1;
                                            const pricePerGbPerMonth = backup.unitPrice ?? 0;
                                            const vpsTotal = (gb * months * pricePerGbPerMonth).toFixed(2);
                                            return (
                                                <div className="bg-gray-50 border border-gray-200 rounded-lg py-3 px-4 mt-1 mb-2 ml-6">
                                                    <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                                                        <Flex align="center" gap={8}>
                                                            <Tag color="blue" style={{ margin: 0 }}>Add-on</Tag>
                                                            <Text strong style={{ fontSize: 13 }}>{backup.productName}</Text>
                                                        </Flex>
                                                        <Flex align="center" gap={24} wrap="wrap">
                                                            <Text style={{ fontSize: 13 }}>{gb} GB &nbsp;·&nbsp; {tenureColumnValue(months)}</Text>
                                                            <div>
                                                                <Text strong style={{ fontSize: 13 }}>₹ {vpsTotal}</Text>
                                                                <Text className="text-gray-400 text-xs block">
                                                                    ₹{pricePerGbPerMonth.toFixed(2)}/GB/mo × {gb} GB × {tenureColumnValue(months)}
                                                                </Text>
                                                            </div>
                                                            <DeleteOutlined
                                                                className="text-gray-600 hover:text-brandSecondary cursor-pointer text-lg"
                                                                onClick={() =>
                                                                    handleRemoveFromCart(backup.productId, backup.planId, backup.billingCycle, backup.productName, 'backup')
                                                                }
                                                            />
                                                        </Flex>
                                                    </Flex>
                                                </div>
                                            );
                                        },
                                    }}
                                />
                            </Card>
                        )}

                        {sharedHostingItems.length > 0 &&
                            renderSectionCard('Shared Hosting', hostingColumns, sharedHostingItems)}

                        {unavailableItems.length > 0 &&
                            renderSectionCard(null, unavailableColumns, unavailableItems)}

                        {emailItems.length > 0 &&
                            renderSectionCard('Titan Email', emailColumns, emailItems)}

                        {workspaceItems.length > 0 &&
                            renderSectionCard('Google Workspace', workspaceColumns, workspaceItems)}

                        {items.length === 0 && (
                            <Card
                                className={sideCardClassName}
                                styles={{ body: sideCardBodyStyle }}
                            >
                                <Flex justify="center" className="py-8">
                                    <Text className="text-gray-400">Your cart is empty</Text>
                                </Flex>
                            </Card>
                        )}
                    </Col>

                    {/* RIGHT */}
                    <Col xs={24} lg={8}>
                        <Card
                            className={`${sideCardClassName} mb-6`}
                            styles={{ body: sideCardBodyStyle }}
                        >
                            <div className="mb-4">
                                <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                                    Total Amount
                                </Title>
                            </div>

                            <Divider />

                            <Flex justify="space-between" className="mb-4">
                                <Text strong>Total</Text>
                                <Text strong>₹ {Number(total).toFixed(2)}</Text>
                            </Flex>

                            <Button
                                block
                                className="bg-lightRed border-lightRed text-white disabled:opacity-50"
                                disabled={!cartData?.allowCheckout}
                                onClick={() => {
                                    navigate(
                                        `${paths.dashboard.domainHosting}/${paths.domainHosting.checkout}`
                                    );
                                }}
                            >
                                Proceed
                            </Button>
                        </Card>

                        <Card className={`${sideCardClassName} hidden`} styles={{ body: sideCardBodyStyle }}>
                            <div className="mb-4">
                                <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                                    Frequently added together
                                </Title>
                            </div>

                            <Flex vertical gap={12}>
                                {[
                                    { label: 'Domain', path: paths.dashboard.domainHosting },
                                    {
                                        label: 'Shared Hosting',
                                        path: `${paths.dashboard.domainHosting}/${paths.domainHosting.sharedHosting}`,
                                    },
                                    {
                                        label: 'Titan Email',
                                        path: `${paths.dashboard.domainHosting}/${paths.domainHosting.titanEmail}`,
                                    },
                                ].map(({ label, path }) => (
                                    <Flex
                                        key={label}
                                        justify="space-between"
                                        align="center"
                                        className="rounded-lg px-4 py-3 cursor-pointer bg-bgLavender"
                                        onClick={() => navigate(path)}
                                    >
                                        <Text strong style={{ color: '#3B0F5D' }}>
                                            {label}
                                        </Text>
                                        <Text className="text-sm" style={{ color: '#3B0F5D' }}>
                                            Show Pricing
                                        </Text>
                                    </Flex>
                                ))}
                            </Flex>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Content>
    );
};

export default CartPage;
