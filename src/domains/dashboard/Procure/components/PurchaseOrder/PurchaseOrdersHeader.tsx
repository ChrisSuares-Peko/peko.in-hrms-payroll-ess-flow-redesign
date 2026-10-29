import React from 'react';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

type Props = {
    search: string;
    onSearch: (val: string) => void;
};

const PurchaseOrdersHeader: React.FC<Props> = ({ search, onSearch }) => {
    const navigate = useNavigate();
    return (
        <Flex gap={16} justify="flex-end" align="center" wrap>
            <Input
                placeholder="Search"
                suffix={<SearchOutlined />}
                allowClear
                value={search}
                onChange={e => onSearch(e.target.value.replace(/\p{Extended_Pictographic}(️|‍\p{Extended_Pictographic})*/gu, ''))}
                maxLength={100}
                style={{ width: 256 }}
            />
            <Button
                type="primary"
                danger
                icon={<PlusOutlined />}
                style={{ borderRadius: 8 }}
                onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.purchaseOrders.index}/${paths.procure.purchaseOrders.create}`)}
            >
                New PO
            </Button>
        </Flex>
    );
};

export default PurchaseOrdersHeader;
