import { useEffect, useRef, useState } from 'react';

import { PlusOutlined, TagsOutlined } from '@ant-design/icons';
import { Button, Flex, Tabs, Tooltip, Typography } from 'antd';
import { useSearchParams } from 'react-router-dom';

import { getServicesTypeConfig } from '@src/domains/admin/accounting/api/services';
import { useAppSelector } from '@src/hooks/store';
import { useFindRolesService } from '@utils/findRolesService';

import ClassificationTabPanel from './ClassificationTabPanel';
import ClassifyServiceDrawer, { CLASSIFY_DRAWER_TITLE } from './ClassifyServiceDrawer';
import ServiceClassificationHeader from './ServiceClassificationHeader';
import useClassificationOptions from '../../hooks/serviceClassification/useClassificationOptions';
import useClassifyServices from '../../hooks/serviceClassification/useClassifyServices';
import { ClassificationOption, ServiceClassificationTab } from '../../types/serviceClassification';
import {
    CLASSIFICATION_TABS,
    NO_PERMISSION_TEXT,
    TAB_LABELS,
} from '../../utils/serviceClassification';

export const SERVICE_CLASSIFICATION_TITLE = 'Service Classification';

type SeedSearch = Record<ServiceClassificationTab, string>;

const NO_SEED: SeedSearch = {
    with_plans: '',
    without_plans: '',
    peko_subscription: '',
    peko_subscription_vendor: '',
};

const tabOfKey = (
    config: {
        service_without_plans: string[];
        peko_service_subscriptions?: string[];
        peko_subscription_vendors?: string[];
    },
    accessKey: string
): ServiceClassificationTab => {
    if (config.peko_subscription_vendors?.includes(accessKey)) return 'peko_subscription_vendor';
    if (config.peko_service_subscriptions?.includes(accessKey)) return 'peko_subscription';
    return config.service_without_plans.includes(accessKey) ? 'without_plans' : 'with_plans';
};

const ServiceClassification = () => {
    const [searchParams] = useSearchParams();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const { services } = useAppSelector(state => state.reducer.services) ?? {};
    const access = useFindRolesService(services?.data, SERVICE_CLASSIFICATION_TITLE, 'Settings');
    const canUpdate = Boolean(access?.update);
    const [activeTab, setActiveTab] = useState<ServiceClassificationTab>('with_plans');
    const [seedSearch, setSeedSearch] = useState<SeedSearch>(NO_SEED);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [drawerKey, setDrawerKey] = useState<string | null>(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const handledRequest = useRef<string | null>(null);
    const {
        options,
        isLoading: loadingOptions,
        refetch: refetchOptions,
    } = useClassificationOptions();
    const { classifyMany, isSaving } = useClassifyServices();

    const requested = searchParams.get('search');

    useEffect(() => {
        if (!requested || loadingOptions || handledRequest.current === requested) return undefined;
        handledRequest.current = requested;
        if (options.some(option => option.accessKey === requested)) {
            setDrawerKey(requested);
            setDrawerOpen(true);
            return undefined;
        }
        let cancelled = false;
        getServicesTypeConfig({ userId: id, userType: role }).then(config => {
            if (cancelled) return;
            const tab = config ? tabOfKey(config, requested) : 'with_plans';
            setActiveTab(tab);
            setSeedSearch(previous => ({ ...previous, [tab]: requested }));
        });
        return () => {
            cancelled = true;
        };
    }, [requested, loadingOptions, options, id, role]);

    const refresh = () => {
        setRefreshKey(key => key + 1);
        refetchOptions();
    };

    const closeDrawer = () => {
        setDrawerOpen(false);
        setDrawerKey(null);
    };

    const submit = async (selected: ClassificationOption[], planType: ServiceClassificationTab) => {
        const result = await classifyMany({ services: selected, planType });
        if (!result) return false;
        closeDrawer();
        setActiveTab(planType);
        refresh();
        return true;
    };

    return (
        <Flex vertical gap={20}>
            <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
                <Flex gap={12} align="center">
                    <Flex
                        align="center"
                        justify="center"
                        className="h-10 w-10 shrink-0 rounded-xl bg-bgIconCard text-lg text-textHeadings"
                    >
                        <TagsOutlined />
                    </Flex>
                    <Typography.Title level={4} className="!mb-0 !text-textHeadings">
                        {SERVICE_CLASSIFICATION_TITLE}
                    </Typography.Title>
                </Flex>
                <Tooltip title={canUpdate ? '' : NO_PERMISSION_TEXT}>
                    <span className="inline-flex">
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            disabled={!canUpdate}
                            onClick={() => {
                                setDrawerKey(null);
                                setDrawerOpen(true);
                            }}
                        >
                            {CLASSIFY_DRAWER_TITLE}
                        </Button>
                    </span>
                </Tooltip>
            </Flex>
            <ServiceClassificationHeader />
            <Tabs
                activeKey={activeTab}
                onChange={key => setActiveTab(key as ServiceClassificationTab)}
                items={CLASSIFICATION_TABS.map(tab => ({
                    key: tab,
                    label: TAB_LABELS[tab],
                    children: (
                        <ClassificationTabPanel
                            tab={tab}
                            canUpdate={canUpdate}
                            seedSearch={seedSearch[tab]}
                            refreshKey={refreshKey}
                            onChanged={refresh}
                        />
                    ),
                }))}
            />
            <ClassifyServiceDrawer
                open={drawerOpen}
                options={options}
                loadingOptions={loadingOptions}
                initialAccessKey={drawerKey}
                isSaving={isSaving}
                onCancel={closeDrawer}
                onSubmit={submit}
            />
        </Flex>
    );
};

export default ServiceClassification;
