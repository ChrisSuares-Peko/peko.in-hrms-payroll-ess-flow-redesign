import React, { useState } from 'react';

import {  PlusOutlined } from '@ant-design/icons';
import { Button, Flex } from 'antd';

import ImportCSVModal from './ImportCSVModal';
import ImportFromPayoutsModal from './ImportFromPayoutsModal';

type Props = {
    onAdd:       () => void;
    onCSVImport?: () => void;
};

const VendorHeader: React.FC<Props> = ({ onAdd, onCSVImport }) => {
    const [csvOpen,     setCsvOpen]     = useState(false);
    const [payoutsOpen, setPayoutsOpen] = useState(false);

    return (
        <>
            <Flex gap={8} align="center" justify="flex-end" wrap="wrap">
                {/* <Button
                    icon={<DownloadOutlined style={{ color: '#FF4F4F' }} />}
                    className="!rounded-lg !border-[#FF4F4F] !text-[#FF4F4F] flex-1 sm:flex-none"
                    onClick={() => setPayoutsOpen(true)}
                >
                    Import from Payouts
                </Button> */}
                {/* hidden for now until we have a use case */}
                {/* <Button
                    icon={<DownloadOutlined style={{ color: '#FF4F4F' }} />}
                    className="!rounded-lg !border-[#FF4F4F] !text-[#FF4F4F] flex-1 sm:flex-none"
                    onClick={() => setCsvOpen(true)}
                >
                    Import CSV
                </Button> */}
                <Button
                    type="primary"
                    danger
                    icon={<PlusOutlined />}
                    className="!rounded-lg flex-1 sm:flex-none w-full sm:w-auto"
                    onClick={onAdd}
                >
                    Add Vendor
                </Button>
            </Flex>
            <ImportCSVModal open={csvOpen} onClose={() => setCsvOpen(false)} onSuccess={onCSVImport} />
            <ImportFromPayoutsModal open={payoutsOpen} onClose={() => setPayoutsOpen(false)} />
        </>
    );
};

export default VendorHeader;
