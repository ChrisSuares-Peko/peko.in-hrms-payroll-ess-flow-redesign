import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateTime } from '@utils/dateFormat';

import { NotificationData } from '../types/index';

interface ColumnsProps {
    handleEdit: (record: NotificationData) => void;
    handleConfirmation: (record: NotificationData) => void;
    accessPermission: any;
}

const getNotificationsColumns = ({
    handleEdit,
    handleConfirmation,
    accessPermission,
}: ColumnsProps): ColumnsType<NotificationData> => [
    {
        title: 'Notification Date',
        dataIndex: 'createdAt',
        sorter: true,
        key: 'date',
        render: (date: string) => <span>{formattedDateTime(new Date(date))}</span>,
    },
    {
        title: 'Notification Title',
        sorter: true,
        dataIndex: 'notificationTitle',
        key: 'notificationTitle',
    },
    {
        title: 'Notification Brief',
        sorter: true,
        dataIndex: 'notificationBrief',
        key: 'notificationBrief',
    },
    {
        title: 'Notification Category',
        sorter: true,
        dataIndex: 'notificationCategory',
        key: 'notificationCategory',
    },
    {
        title: 'Notification To',
        sorter: true,
        dataIndex: 'notificationTo',
        key: 'notificationTo',
    },
    {
        title: 'Edit',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: NotificationData) => (
            <Tooltip
                placement="top"
                title={
                    !accessPermission?.update
                        ? 'Sorry, you do not have permission to perform this action'
                        : ''
                }
            >
                <span>
                    {!accessPermission?.update ? (
                        <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} disabled />
                    ) : (
                        <EditOutlined onClick={() => handleEdit(record)} />
                    )}
                </span>
            </Tooltip>
        ),
    },
    {
        title: 'Delete',
        dataIndex: 'action',
        key: 'id',
        render: (_: any, record: NotificationData) => (
            <Tooltip
                placement="top"
                title={
                    !accessPermission?.update
                        ? 'Sorry, you do not have permission to perform this action'
                        : ''
                }
            >
                <span>
                    {!accessPermission?.update ? (
                        <DeleteOutlined style={{ color: 'gray', cursor: 'not-allowed' }} disabled />
                    ) : (
                        <DeleteOutlined onClick={() => handleConfirmation(record)} />
                    )}
                </span>
            </Tooltip>
        ),
    },
];

export default getNotificationsColumns;
