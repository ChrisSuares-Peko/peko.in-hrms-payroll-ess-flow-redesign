import { useState } from 'react';

import { DeleteOutlined, SwapRightOutlined } from '@ant-design/icons';
import { Button, DatePicker, Dropdown, Flex, Modal, Row, Select } from 'antd';
import dayjs from 'dayjs';

import useScreenSize from '@src/hooks/useScreenSize';

const dateFormat = 'YYYY-MM-DD';
const disabledDate = (current: any) => current && current > dayjs().endOf('day');

const statusOptions = [
    { label: 'All', value: '' },
    { label: 'Failed', value: 'FAILED' },
    { label: 'Processed', value: 'PROCESSED' },
    { label: 'Pending', value: 'PENDING' },
];

const contextOptions = [
    { label: 'All Contexts', value: '' },
    { label: 'Charge (Renewal)', value: 'SUBSCRIPTION_CHARGE' },
    { label: 'Auth (Mandate Setup)', value: 'SUBSCRIPTION_AUTH' },
];

type ClearOption = {
    status: string;
    label: string;
    description: string;
};

const clearOptions: ClearOption[] = [
    {
        status: 'PROCESSED',
        label: 'Clear Processed',
        description: 'This will permanently delete all PROCESSED webhook events. This cannot be undone.',
    },
    {
        status: 'FAILED',
        label: 'Clear Failed',
        description: 'This will permanently delete all FAILED webhook events. This cannot be undone.',
    },
    {
        status: 'ALL',
        label: 'Clear All',
        description: 'This will permanently delete ALL webhook events regardless of status. This cannot be undone.',
    },
];

type Props = {
    from: string;
    to: string;
    status: string | undefined;
    webhookContext: string | undefined;
    handleFromChange: (dates: any, dateStrings: any) => void;
    handleToChange: (dates: any, dateStrings: any) => void;
    handleDateChange: (dates: any, dateStrings: any) => void;
    onStatusChange: (val: string) => void;
    onContextChange: (val: string) => void;
    onClear: (status: string) => void;
    isClearing: boolean;
};

const Header = ({
    from,
    to,
    status,
    webhookContext,
    handleFromChange,
    handleToChange,
    handleDateChange,
    onStatusChange,
    onContextChange,
    onClear,
    isClearing,
}: Props) => {
    const { xs } = useScreenSize();
    const [pendingClear, setPendingClear] = useState<ClearOption | null>(null);

    const dropdownItems = clearOptions.map(opt => ({
        key: opt.status,
        label: opt.label,
        danger: opt.status === 'ALL',
        onClick: () => setPendingClear(opt),
    }));

    return (
        <>
            <Row justify="end" className="w-full gap-3">
                <Flex className="flex-col justify-end w-full gap-3 md:flex-row sm:w-auto">
                    <Select
                        value={status ?? ''}
                        options={statusOptions}
                        placeholder="Status"
                        className="min-w-36"
                        onChange={onStatusChange}
                    />
                    <Select
                        value={webhookContext ?? ''}
                        options={contextOptions}
                        placeholder="Context"
                        className="min-w-48"
                        onChange={onContextChange}
                    />
                    {xs ? (
                        <Flex className="w-full sm:w-fit" justify="space-between" align="center">
                            <DatePicker
                                onChange={handleFromChange}
                                format={dateFormat}
                                defaultValue={dayjs(from, dateFormat)}
                                disabledDate={disabledDate}
                            />
                            <SwapRightOutlined />
                            <DatePicker
                                onChange={handleToChange}
                                format={dateFormat}
                                defaultValue={dayjs(to, dateFormat)}
                                disabledDate={disabledDate}
                            />
                        </Flex>
                    ) : (
                        <DatePicker.RangePicker
                            onChange={handleDateChange}
                            format={dateFormat}
                            className="min-w-40"
                            value={[dayjs(from, dateFormat), dayjs(to, dateFormat)]}
                            disabledDate={disabledDate}
                        />
                    )}
                    <Dropdown menu={{ items: dropdownItems }} trigger={['click']} disabled={isClearing}>
                        <Button danger icon={<DeleteOutlined />} loading={isClearing}>
                            Clear
                        </Button>
                    </Dropdown>
                </Flex>
            </Row>

            <Modal
                title={pendingClear?.label}
                open={!!pendingClear}
                onOk={() => {
                    if (pendingClear) onClear(pendingClear.status);
                    setPendingClear(null);
                }}
                onCancel={() => setPendingClear(null)}
                okText="Yes, Delete"
                okButtonProps={{ danger: true }}
                cancelText="Cancel"
            >
                <p>{pendingClear?.description}</p>
            </Modal>
        </>
    );
};

export default Header;
