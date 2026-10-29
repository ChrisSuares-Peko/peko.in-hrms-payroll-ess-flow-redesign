import { ReloadOutlined } from '@ant-design/icons';
import { Button, Collapse, Flex, Spin } from 'antd';

import DrawerModal from '@components/atomic/DrawerModal';

import { DocumentsSection, extractPeople, PeopleSection, VendorTimeline } from './DrawerActivity';
import { BusinessSection, OverviewSection } from './DrawerOverview';
import { BRAdminApplication } from '../../api/businessRegistration';

type Props = {
    open: boolean;
    application: BRAdminApplication | null;
    loading: boolean;
    onClose: () => void;
    onRetry?: () => void;
    onForceFile?: () => void;
    retryLoading?: boolean;
};

const ApplicationDetailDrawer = ({
    open,
    application,
    loading,
    onClose,
    onRetry,
    onForceFile,
    retryLoading,
}: Props) => {
    if (!application) return null;

    const people = extractPeople(application.applicationData ?? {});
    const stageCount = Object.keys(application.vendorStages ?? {}).length;
    // Retry only makes sense when the chain failed, or never started on a
    // submitted application — the BE enforces the same states (plus paid-only).
    const canRetry =
        Boolean(onRetry) &&
        application.paymentStatus === 'COMPLETED' &&
        (application.vendorStatus === 'FAILED' ||
            ((application.vendorStatus ?? 'NOT_SENT') === 'NOT_SENT' &&
                application.status === 'SUBMITTED'));
    // Force-file makes sense only when the block is the documents stage — files
    // Smart Form 2 regardless of docs; the RM collects the missing ones.
    const canForceFile =
        Boolean(onForceFile) && canRetry && application.vendorStages?.documents?.status === 'failed';

    const items = [
        {
            key: 'overview',
            label: 'Overview',
            children: <OverviewSection application={application} />,
        },
        {
            key: 'business',
            label: 'Business & Contact',
            children: <BusinessSection application={application} />,
        },
        {
            key: 'people',
            label: `Directors / Partners (${people.length})`,
            children: <PeopleSection people={people} />,
        },
        {
            key: 'documents',
            label: `Documents (${application.documents?.length ?? 0})`,
            children: <DocumentsSection application={application} />,
        },
        {
            key: 'vendor',
            label: `Vendor Stages (${stageCount})`,
            children: (
                <Flex vertical gap={12}>
                    {canRetry && (
                        <Flex justify="end" gap={8}>
                            {canForceFile && (
                                <Button danger loading={retryLoading} onClick={onForceFile}>
                                    File &amp; skip documents
                                </Button>
                            )}
                            <Button
                                icon={<ReloadOutlined />}
                                loading={retryLoading}
                                onClick={onRetry}
                            >
                                Retry Vendor Sync
                            </Button>
                        </Flex>
                    )}
                    <VendorTimeline application={application} />
                </Flex>
            ),
        },
    ];

    return (
        <DrawerModal
            open={open}
            handleCancel={onClose}
            modalTitle={`Application — ${application.applicationId}`}
            closeIcon
            width={900}
        >
            {loading ? (
                <Flex justify="center" align="center" className="h-64">
                    <Spin size="large" />
                </Flex>
            ) : (
                <Collapse items={items} defaultActiveKey={['overview', 'business']} className="w-full" />
            )}
        </DrawerModal>
    );
};

export default ApplicationDetailDrawer;
