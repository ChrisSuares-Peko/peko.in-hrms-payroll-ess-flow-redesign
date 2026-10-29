import { Table } from 'antd';

import { paymentDataSource } from '../utils/data';

type Props = {};

const columns = [
    {
        title: 'LEFT',
        dataIndex: 'left',
        key: 'left',
    },
    {
        title: 'RIGHT',
        dataIndex: 'right',
        key: 'right',
    },
];

const PaymentStatusTable = (props: Props) => (
    <Table
        className="w-full sm:w-7/12"
        pagination={false}
        bordered
        size="small"
        dataSource={paymentDataSource}
        columns={columns}
        showHeader={false}
        style={{ borderRadius: 0 }} // Set border radius to 0
    />
);

export default PaymentStatusTable;
