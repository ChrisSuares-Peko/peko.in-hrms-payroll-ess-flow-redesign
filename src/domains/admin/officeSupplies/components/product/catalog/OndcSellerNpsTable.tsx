import { useState } from 'react';

import { Button, Flex, Modal, Switch, Typography } from 'antd';
import { TableProps } from 'antd/lib';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import GenericTable from '@components/atomic/GenericTable';

import { AdminOndcSellerNp, SellerNpProductAction } from '../../../types/ondcSellerNp';

dayjs.extend(relativeTime);

type Props = {
    tableData: AdminOndcSellerNp[];
    isLoading: boolean;
    onTableChange?: TableProps<AdminOndcSellerNp>['onChange'];
    onToggleEnabled: (
        id: number,
        enabled: boolean,
        productAction?: SellerNpProductAction
    ) => Promise<boolean>;
};

const products = (n: number) => `${n} ${n === 1 ? 'product' : 'products'}`;

const OndcSellerNpsTable = ({ tableData, isLoading, onTableChange, onToggleEnabled }: Props) => {
    // the NP being switched off while the admin picks what happens to its products
    const [disabling, setDisabling] = useState<AdminOndcSellerNp | null>(null);
    const [busy, setBusy] = useState<SellerNpProductAction | null>(null);

    const onSwitch = (r: AdminOndcSellerNp, checked: boolean) => {
        if (!checked && r.productCount > 0) {
            setDisabling(r);
            return;
        }
        onToggleEnabled(r.id, checked);
    };

    const confirmDisable = async (productAction: SellerNpProductAction) => {
        if (!disabling) return;
        setBusy(productAction);
        const done = await onToggleEnabled(disabling.id, false, productAction);
        setBusy(null);
        if (done) setDisabling(null);
    };

    const columns = [
        {
            title: 'Seller NP',
            key: 'npName',
            width: 220,
            render: (_: unknown, r: AdminOndcSellerNp) => (
                <Flex vertical gap={2}>
                    <Typography.Text className="text-[#101828] font-medium">
                        {r.npName || '—'}
                    </Typography.Text>
                    <Typography.Text className="font-mono text-[12px] text-[#667085]">
                        {r.bppId}
                    </Typography.Text>
                </Flex>
            ),
        },
        {
            title: 'BPP URI',
            dataIndex: 'bppUri',
            key: 'bppUri',
            width: 280,
            render: (v: string | null) => (
                <Typography.Text className="font-mono text-[12px] text-[#475156]">
                    {v || '—'}
                </Typography.Text>
            ),
        },
        {
            title: 'Products',
            dataIndex: 'productCount',
            key: 'productCount',
            width: 100,
            render: (n: number) => n ?? 0,
        },
        {
            title: 'Last seen',
            dataIndex: 'lastSeenAt',
            key: 'lastSeenAt',
            width: 160,
            render: (iso: string | null) => (iso ? dayjs(iso).fromNow() : '—'),
        },
        {
            title: 'Enabled',
            key: 'enabled',
            width: 110,
            render: (_: unknown, r: AdminOndcSellerNp) => (
                <Switch
                    checked={r.enabled}
                    onChange={checked => onSwitch(r, checked)}
                    style={{ backgroundColor: r.enabled ? '#22c55e' : undefined }}
                />
            ),
        },
    ];

    const name = disabling ? disabling.npName || disabling.bppId : '';

    return (
        <>
            <GenericTable
                rowKey="id"
                columns={columns}
                dataSource={tableData}
                loading={isLoading}
                pagination={false}
                onChange={onTableChange}
                scroll={{ x: 1000 }}
            />
            <Modal
                open={!!disabling}
                title={`Disable ${name}?`}
                onCancel={() => setDisabling(null)}
                maskClosable={!busy}
                closable={!busy}
                footer={[
                    <Button key="cancel" disabled={!!busy} onClick={() => setDisabling(null)}>
                        Cancel
                    </Button>,
                    <Button
                        key="disable"
                        loading={busy === 'disable'}
                        disabled={!!busy && busy !== 'disable'}
                        onClick={() => confirmDisable('disable')}
                    >
                        Disable products
                    </Button>,
                    <Button
                        key="delete"
                        type="primary"
                        danger
                        loading={busy === 'delete'}
                        disabled={!!busy && busy !== 'delete'}
                        onClick={() => confirmDisable('delete')}
                    >
                        Delete products
                    </Button>,
                ]}
            >
                {disabling && (
                    <div className="flex flex-col gap-3 pt-1 text-[13px] text-[#344054]">
                        <span>
                            {name} has{' '}
                            <span className="font-semibold text-[#101828]">
                                {products(disabling.productCount)}
                            </span>{' '}
                            in the catalog. What should happen to them?
                        </span>
                        <ul className="m-0 flex flex-col gap-1 pl-5 text-[12px] text-[#475467]">
                            <li>
                                <span className="font-medium text-[#101828]">Disable products</span>{' '}
                                — switched off, shown as off in Catalog, and switched back on if you
                                enable this NP again.
                            </li>
                            <li>
                                <span className="font-medium text-[#101828]">Delete products</span>{' '}
                                — removed from the database. They come back only if you enable the
                                NP and the seller sends its catalog again.
                            </li>
                        </ul>
                        <span className="text-[12px] text-[#667085]">
                            Products of a disabled NP are also removed by the nightly clean-up once
                            they haven&apos;t been refreshed for 24 hours.
                        </span>
                    </div>
                )}
            </Modal>
        </>
    );
};

export default OndcSellerNpsTable;
