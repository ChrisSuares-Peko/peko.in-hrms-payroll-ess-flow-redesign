import { FC, useEffect, useRef, useState } from 'react';

import { Input, Modal, Select, Spin, Typography } from 'antd';

import { SellerOption } from '../../../../types/ondcCatalogRules';

interface Props {
    open: boolean;
    submitting: boolean;
    searchSellers: (search: string) => Promise<SellerOption[]>;
    onCancel: () => void;
    onConfirm: (seller: SellerOption, reason: string) => void;
}

const optionKey = (s: SellerOption) => `${s.bppId}|${s.providerId}`;

const BlockSellerModal: FC<Props> = ({ open, submitting, searchSellers, onCancel, onConfirm }) => {
    const [options, setOptions] = useState<SellerOption[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedKey, setSelectedKey] = useState<string>();
    const [reason, setReason] = useState('');
    const timer = useRef<ReturnType<typeof setTimeout>>();
    const latest = useRef(0);

    const runSearch = (search: string) => {
        clearTimeout(timer.current);
        timer.current = setTimeout(async () => {
            latest.current += 1;
            const ticket = latest.current;
            setSearching(true);
            const rows = await searchSellers(search);
            // a slower, older search must not overwrite a newer one
            if (ticket !== latest.current) return;
            setOptions(rows);
            setSearching(false);
        }, 300);
    };

    useEffect(() => {
        if (!open) return undefined;
        setSelectedKey(undefined);
        setReason('');
        runSearch('');
        return () => clearTimeout(timer.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const selected = options.find(s => optionKey(s) === selectedKey);

    return (
        <Modal
            open={open}
            title="Block a seller"
            okText="Block seller"
            okButtonProps={{ disabled: !selected || !reason.trim(), loading: submitting }}
            onOk={() => selected && onConfirm(selected, reason.trim())}
            onCancel={onCancel}
            destroyOnClose
        >
            <div className="flex flex-col gap-4 pb-5 pt-2">
                <Typography.Text className="text-[12px] text-[#667085]">
                    Products from this seller are hidden from corporates, including products they
                    add later.
                </Typography.Text>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-medium text-[#344054]">Seller</span>
                    <Select
                        showSearch
                        placeholder="Search a seller by name or provider id"
                        value={selectedKey}
                        onChange={setSelectedKey}
                        onSearch={runSearch}
                        filterOption={false}
                        notFoundContent={searching ? <Spin size="small" /> : 'No sellers found'}
                        options={options.map(s => ({
                            value: optionKey(s),
                            label: `${s.sellerName || s.providerId} (${s.providerId}) · ${s.productCount} products`,
                        }))}
                    />
                </div>
                <div className="flex flex-col gap-1.5">
                    <span className="text-[12px] font-medium text-[#344054]">Reason</span>
                    <Input.TextArea
                        rows={3}
                        maxLength={160}
                        showCount
                        placeholder="e.g. Industrial equipment — outside Office Supplies scope"
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default BlockSellerModal;
