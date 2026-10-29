import { ReactNode } from 'react';

import { Flex, Image, Table } from 'antd';

import { tableData } from '../utils/data';

interface Products {
    key: string;
    avatar: string;
    model: string;
    battery: string;
    speaker: string;
    connectivity: string;
    charging: string;
    display: string;
    bluetooth: string;
}

interface TableColumn {
    title: string;
    dataIndex: string;
    key: string;
    render?: (text: string, record: Products) => ReactNode;
}

const SoundboxTable: React.FC = () => {
    const columns: TableColumn[] = [
        {
            title: 'MODEL',
            dataIndex: 'model',
            key: 'model',
            render: (text, record) => (
                <Flex justify="space-between" align="center">
                    <Image
                        src={`src/domains/dashboard/soundbox/assets/icons/${record.avatar}.png`}
                        preview={false}
                    />
                    {text}
                </Flex>
            ),
        },
        {
            title: 'BATTERY BACKUP',
            dataIndex: 'battery',
            key: 'battery',
        },
        {
            title: 'SPEAKER',
            dataIndex: 'speaker',
            key: 'speaker',
        },
        {
            title: 'CONNECTIVITY',
            dataIndex: 'connectivity',
            key: 'connectivity',
        },
        {
            title: 'CHARGING',
            dataIndex: 'charging',
            key: 'charging',
        },
        {
            title: 'LCD DISPLAY',
            dataIndex: 'display',
            key: 'display',
        },
        {
            title: 'BLUETOOTH',
            dataIndex: 'bluetooth',
            key: 'bluetooth',
        },
    ];

    return <Table dataSource={tableData} columns={columns} pagination={false} />;
};

export default SoundboxTable;
