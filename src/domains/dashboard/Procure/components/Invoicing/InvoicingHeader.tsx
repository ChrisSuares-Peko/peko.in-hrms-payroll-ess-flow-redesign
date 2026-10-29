import React from 'react';

import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

const InvoicingHeader: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Button
            type="primary"
            danger
            icon={<PlusOutlined />}
            className="!rounded-lg flex-1 sm:flex-none w-full sm:w-auto"
            onClick={() => navigate(`${paths.dashboard.procure}/${paths.procure.invoicing.index}/upload`)}
        >
            Add Invoice
        </Button>
    );
};

export default InvoicingHeader;
