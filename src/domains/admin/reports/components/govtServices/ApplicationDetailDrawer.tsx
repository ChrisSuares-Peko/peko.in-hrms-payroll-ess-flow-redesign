import { Collapse, Flex, Spin } from 'antd';

import DrawerModal from '@components/atomic/DrawerModal';

import { BusinessSection, FilingSection, OverviewSection } from './DrawerOverview';
import { GSV2AdminApplication } from '../../api/governmentServicesApplicationV2';

type Props = {
    open: boolean;
    application: GSV2AdminApplication | null;
    loading: boolean;
    onClose: () => void;
};

// Read-only — no vendor-retry/approve-reject/notes action exists; status is entirely system-driven (see constants.ts).
const ApplicationDetailDrawer = ({ open, application, loading, onClose }: Props) => {
    if (!application) return null;

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
            key: 'filing',
            label: 'Filing Details',
            children: <FilingSection application={application} />,
        },
    ];

    return (
        <DrawerModal
            open={open}
            handleCancel={onClose}
            modalTitle={`Application — ${application.applicationId || application.id}`}
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
