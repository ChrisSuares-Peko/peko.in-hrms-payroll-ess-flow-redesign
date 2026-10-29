import { DeleteOutlined } from '@ant-design/icons';
import { Flex, Button, Typography } from 'antd';
import type { TableProps } from 'antd';
import moment from 'moment';
import { ReactSVG } from 'react-svg';

import MoreServicesIcon from '@domains/dashboard/Payroll/assets/icons/viewMore.svg';

import { AnnouncementDataType } from '../types/types';



type ColumnProps = {
    handleDelete: (id: string) => void;
    toggleModal: () => void;
    setSelectedAnnouncement: (data: any) => void;
};

export const getAnnouncementColumns = ({
    handleDelete,
    toggleModal,
    setSelectedAnnouncement,
}: ColumnProps): TableProps<AnnouncementDataType>['columns'] => [
    {
        title: <Flex>Date Added</Flex>,
        dataIndex: 'date',
        key: 'date',
        render: (data: any) => <Flex>{moment(data, 'DD/MM/YYYY').format('YYYY-MM-DD')}</Flex>,
    },
    {
        title: <Flex>Subject</Flex>,
        dataIndex: 'subject',
        key: 'subject',
        render: (data: any) => <Flex>{data}</Flex>,
    },
    {
        title: <Flex>Details</Flex>,
        dataIndex: 'details',
        key: 'details',
        render: (data: any) => <Typography.Text>{data}</Typography.Text>,
    },
    {
        title: <Flex justify="center">Status</Flex>,
        dataIndex: 'status',
        key: 'status',
        render: (data: any) => <Flex justify="center">{data}</Flex>,
    },
    {
        title: <Flex justify="center">Action</Flex>,
        dataIndex: 'action',
        key: 'action',
        render: (_, record) => (
            <Flex align="center" justify="center" className="-mt-3">
                <Button
                    type="link"
                    onClick={() => {
                        toggleModal();
                        setSelectedAnnouncement(record);
                    }}
                >
                    <ReactSVG
                        src={MoreServicesIcon}
                        className="svg-primary-stroke cursor-pointer mt-1 text-lg"
                    />
                </Button>
                <Button className="border-0 text-lg" onClick={() => handleDelete(record.id)}>
                    <DeleteOutlined className="text-textRed text-lg" />
                </Button>
            </Flex>
        ),
    },
];
