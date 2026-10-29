import { useState } from 'react';

import { PaperClipOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { getVendorLedgerSlip } from '../../api/vendorLedger';
import { VendorSlip } from '../../types/vendorLedger';

const SLIP_MIME: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
};

const SlipLink = ({ slip }: { slip: VendorSlip }) => {
    const dispatch = useAppDispatch();
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [opening, setOpening] = useState(false);
    const { slipKey, slipName, slipFormat } = slip;

    if (!slipKey) return <span className="text-navTextColor">—</span>;

    const open = async () => {
        setOpening(true);
        const data = await getVendorLedgerSlip({ userId: id, userType: role, slipKey });
        setOpening(false);

        if (!data || !data.buffer || !data.buffer.data) {
            dispatch(showToast({ description: 'Could not open the slip', variant: 'error' }));
            return;
        }

        const extension = (data.type || slipFormat || 'pdf').toLowerCase();
        const blob = new Blob([new Uint8Array(data.buffer.data)], {
            type: SLIP_MIME[extension] || 'application/octet-stream',
        });
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank', 'noopener,noreferrer');
        setTimeout(() => URL.revokeObjectURL(url), 10000);
    };

    return (
        <Tooltip title={slipName || 'Open slip'}>
            <Button
                type="link"
                size="small"
                className="!px-0"
                loading={opening}
                icon={<PaperClipOutlined />}
                onClick={open}
            >
                <span className="inline-block max-w-[110px] truncate align-bottom">
                    {slipName || 'Slip'}
                </span>
            </Button>
        </Tooltip>
    );
};

export default SlipLink;
