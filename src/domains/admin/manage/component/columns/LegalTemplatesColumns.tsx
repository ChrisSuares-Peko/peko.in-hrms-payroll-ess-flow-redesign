import { CheckOutlined, CloseOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Flex, Tag, Tooltip, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { LegalTemplatesBody, RolePermissionAccessData } from '../../types/legalTemplates';

interface ColumnsProps {
    handleActive: (templateId: number | string, isActive: any) => void;
    handleEdit: (record: LegalTemplatesBody) => void;
    handleConfirmation: (record: LegalTemplatesBody) => void;
    accessPermission: RolePermissionAccessData | undefined;
}

const getLegalTemplatesColumns = ({
    handleActive,
    handleEdit,
    handleConfirmation,
    accessPermission,
}: ColumnsProps): ColumnsType<LegalTemplatesBody> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',
        sorter: true,
        key: 'createdAt',
        render: (createdAt: string) => (
            <Flex vertical>
                <Typography.Text>{formattedDateOnly(new Date(createdAt))}</Typography.Text>
                <Typography.Text type="secondary" className="text-xs">
                    {formattedTime(new Date(createdAt))}
                </Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Title',
        dataIndex: 'title',
        sorter: true,
        key: 'title',
    },
    {
        title: 'Category',
        dataIndex: 'category',
        sorter: true,
        key: 'category',
        render: (category: string) => <Tag color="red">{category}</Tag>,
    },
    {
        title: 'Description',
        dataIndex: 'description',
        key: 'description',
        render: (description: string) => (
            <Typography.Text ellipsis={{ tooltip: description }} style={{ maxWidth: 220 }}>
                {description}
            </Typography.Text>
        ),
    },
    {
        title: 'Time',
        dataIndex: 'timeEstimate',
        key: 'timeEstimate',
    },
    {
        title: 'Status',
        dataIndex: 'isActive',
        sorter: true,
        key: 'isActive',
        render: (isActive: boolean, record: LegalTemplatesBody) => (
            <Tooltip
                placement="top"
                title={
                    !accessPermission?.update
                        ? 'Sorry, you do not have permission to perform this action'
                        : ''
                }
            >
                <span>
                    {isActive ? (
                        <CheckOutlined
                            className={`cursor-pointer ${accessPermission?.update ? 'text-textLime' : 'text-gray-400'}`}
                            style={{ cursor: accessPermission?.update ? 'pointer' : 'not-allowed' }}
                            onClick={() =>
                                accessPermission?.update && handleActive(record.id, record.isActive)
                            }
                        />
                    ) : (
                        <CloseOutlined
                            className={`cursor-pointer ${accessPermission?.update ? 'text-brandColor' : 'text-gray-400'}`}
                            style={{ cursor: accessPermission?.update ? 'pointer' : 'not-allowed' }}
                            onClick={() =>
                                accessPermission?.update && handleActive(record.id, record.isActive)
                            }
                        />
                    )}
                </span>
            </Tooltip>
        ),
    },
    {
        title: 'Edit',
        key: 'edit',
        render: (_: any, record: LegalTemplatesBody) => (
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
                        <EditOutlined style={{ color: 'gray', cursor: 'not-allowed' }} />
                    ) : (
                        <EditOutlined onClick={() => handleEdit(record)} />
                    )}
                </span>
            </Tooltip>
        ),
    },
    {
        title: 'Delete',
        key: 'delete',
        render: (_: any, record: LegalTemplatesBody) => (
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
                        <DeleteOutlined style={{ color: 'gray', cursor: 'not-allowed' }} />
                    ) : (
                        <DeleteOutlined onClick={() => handleConfirmation(record)} />
                    )}
                </span>
            </Tooltip>
        ),
    },
];

export default getLegalTemplatesColumns;
