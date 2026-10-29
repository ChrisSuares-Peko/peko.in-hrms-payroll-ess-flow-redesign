import { EditOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';
import { ColumnsType } from 'antd/lib/table';

import { formattedDateOnly, formattedTime } from '@utils/dateFormat';

import { KYBVerification } from '../../types/kybVerification';

interface ColumnsProps {
    handleEdit: (record: KYBVerification) => void;
}

const getKybVerificationColumns = ({ handleEdit }: ColumnsProps): ColumnsType<KYBVerification> => [
    {
        title: 'Date',
        dataIndex: 'createdAt',

        key: 'createdAt',
        render: (createdAt: any) => (
            <Flex vertical>
                <Typography.Text className="text-nowrap">
                    {formattedDateOnly(new Date(createdAt))}
                </Typography.Text>
                <Typography.Text>{formattedTime(new Date(createdAt))}</Typography.Text>
            </Flex>
        ),
    },
    {
        title: 'Document Type',
        dataIndex: 'documentType',
        key: 'documentType',
    },
    {
        title: 'Document Number',
        dataIndex: 'documentNumber',
        key: 'documentNumber',
    },
    {
        title: 'Legal Business Name',
        dataIndex: 'legalNameOfBusiness',
        key: 'legalNameOfBusiness',
    },
    {
        title: 'Verification Status',
        key: 'verificationStatus',
        render: (_: any, record: any) => {
            // Determine the correct field dynamically
            const verificationStatus = record.gstVerified ?? record.panVerified ?? null;

            return (
                <Typography.Text className={verificationStatus ? 'text-green-500' : 'text-red-500'}>
                    {verificationStatus ? 'Verified' : 'Not Verified'}
                </Typography.Text>
            );
        },
    },

    {
        title: 'Corporate User ID',
        dataIndex: 'corporateUserId',
        key: 'corporateUserId',
    },

    {
        title: 'Edit',
        key: 'edit',
        render: (_: any, record: KYBVerification) => (
            <EditOutlined className="cursor-pointer" onClick={() => handleEdit(record)} />
        ),
    },
];

export default getKybVerificationColumns;
