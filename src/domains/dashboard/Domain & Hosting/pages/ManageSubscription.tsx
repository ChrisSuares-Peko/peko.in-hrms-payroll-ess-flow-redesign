import { useCallback, useEffect, useState } from 'react';

import { Button, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { useAppSelector } from '@src/hooks/store';

import { deletePlan, generateSsoLogin, getOrderHistory } from '../api/index';
import SubscriptionHistoryTable from '../components/manage-subscription/SubscriptionHistoryTable';
import useHostingPlans from '../hooks/useHostingPlans';
import { type Order, type ProvisionResult } from '../types/index';
import { formatControlPanel } from '../utils/vpsUtils';

const { Title } = Typography;

type SubRow = {
    key: string;
    corporateTxnId: string;
    itemType: string;
    productName: string;
    billingCycle?: number;
    price: number;
    unitPrice?: number;
    os?: string;
    addons?: string[];
    controlPanel?: string;
    provision?: ProvisionResult;
    transactionDate: string;
    orderStatus: string;
    productId: string;
};

const ManageSubscriptions = () => {
    const { id, role } = useAppSelector(s => s.reducer.auth);
    const { plans: vpsPlans } = useHostingPlans('vps_server');

    const [orders, setOrders] = useState<Order[]>([]);
    const [totalRecords, setTotalRecords] = useState(0);
    const [page, setPage] = useState(1);
    const [subSearch, setSubSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [cancellingId, setCancellingId] = useState<string | null>(null);
    const [ssoLoading, setSsoLoading] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<{
        provision: ProvisionResult;
        corporateTxnId: string;
        productId: string;
    } | null>(null);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getOrderHistory({
                userId: id,
                userType: role,
                page,
                itemsPerPage: 10,
                searchText: subSearch || undefined,
            });
            if (res) {
                setOrders(res.orders ?? []);
                setTotalRecords(res.totalRecords ?? 0);
            }
        } finally {
            setLoading(false);
        }
    }, [id, role, page, subSearch]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleSsoLogin = useCallback(async () => {
        setSsoLoading(true);
        const res = await generateSsoLogin({ userId: id, userType: role });
        if (res && res.redirectUrl) window.open(res.redirectUrl, '_blank');
        setSsoLoading(false);
    }, [id, role]);

    const requestCancelPlan = (provision: ProvisionResult, corporateTxnId: string, productId: string) => {
        setCancelTarget({ provision, corporateTxnId, productId });
    };

    const confirmCancelPlan = async () => {
        if (!cancelTarget) return;
        const { provision, corporateTxnId, productId } = cancelTarget;
        const orderId = provision.result?.entityid ?? provision.result?.orderid;
        if (!orderId) {
            setCancelTarget(null);
            return;
        }
        const key = String(orderId);
        setCancellingId(key);
        await deletePlan({
            userId: id,
            userType: role,
            orderId,
            itemType: provision.itemType,
            corporateTxnId,
            productId,
        });
        setCancellingId(null);
        setCancelTarget(null);
        fetchOrders();
    };

    const osDisplayMap = Object.fromEntries(
        vpsPlans.flatMap(p =>
            (p.vendorDetails?.supported_os ?? []).map(o => [o.os_name, o.os_display_name])
        )
    );

    const subscriptionRows: SubRow[] = orders.flatMap(order =>
        (order.items ?? [])
            .map(item => ({
                key: `${order.corporateTxnId}-${item.productId}`,
                corporateTxnId: order.corporateTxnId,
                itemType: item.itemType,
                productName: item.productName,
                billingCycle: item.billingCycle,
                price: parseFloat(item.totalPrice.toFixed(2)),
                unitPrice: item.unitPrice,
                os: item.os ? (osDisplayMap[item.os] ?? item.os) : undefined,
                addons: item.addons,
                controlPanel: item.controlPanel ? formatControlPanel(item.controlPanel) : undefined,
                transactionDate: order.transactionDate,
                orderStatus: order.status,
                productId: item.productId,
                provision: (order.provisionResults ?? []).find(p => {
                if (p.itemType !== item.itemType) return false;
                if (item.itemType === 'domain') return p.domainName === item.productName;
                return true;
            }),
            }))
    );

    return (
        <Content className="bg-white min-h-screen px-4 sm:px-6 py-6">
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <Title level={3} style={{ margin: 0 }}>
                        Manage Subscriptions
                    </Title>
                    <Button className="bg-lightRed border-lightRed text-white" loading={ssoLoading} onClick={handleSsoLogin}>
                        Manage Panel
                    </Button>
                </div>

                <SubscriptionHistoryTable
                    loading={loading}
                    rows={subscriptionRows}
                    subSearch={subSearch}
                    onSubSearch={v => {
                        setSubSearch(v);
                        setPage(1);
                    }}
                    cancellingId={cancellingId}
                    page={page}
                    totalRecords={totalRecords}
                    onPageChange={setPage}
                    onCancel={requestCancelPlan}
                />
            </div>

            <ConfirmationModal
                isOpen={!!cancelTarget}
                handleCancel={() => setCancelTarget(null)}
                title="Cancel subscription"
                description="Are you sure you want to cancel this subscription? This will start the cancellation process."
                isLoading={cancellingId !== null}
                handleSubmit={confirmCancelPlan}
            />
        </Content>
    );
};

export default ManageSubscriptions;
