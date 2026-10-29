import { useState } from 'react';

import { DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { Col, Typography } from 'antd';

import TextInput from '@components/atomic/inputs/TextInput';

import PersonAddressFields from '../PersonAddressFields';
import PersonIdentityFields from '../PersonIdentityFields';
import SaveProgressButton from '../SaveProgressButton';

const { Text } = Typography;

interface PartnerCardProps {
    index: number;
    canRemove: boolean;
    onRemove: () => void;
}

// One collapsible/removable partner in the Partnership KYC step (Figma 1835:23412).
const PartnerCard = ({ index, canRemove, onRemove }: PartnerCardProps) => {
    const [open, setOpen] = useState(true);
    const prefix = `partners.${index}`;
    const n = (field: string) => `${prefix}.${field}`;

    return (
        <div className="border border-[#e4e4e7] rounded-[24px] p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">Partner</Text>
                    <span className="bg-[#fff3f3] text-[#ff4f4f] text-[14px] rounded-full px-[7px] leading-[22px]">
                        {index + 1}
                    </span>
                </div>
                <div className="flex items-center gap-4">
                    <DeleteOutlined
                        onClick={canRemove ? onRemove : undefined}
                        className={canRemove ? 'text-[#94a3b8] cursor-pointer' : 'text-[#e5e7eb]'}
                    />
                    <button type="button" onClick={() => setOpen(o => !o)} className="text-[#94a3b8]">
                        {open ? <UpOutlined /> : <DownOutlined />}
                    </button>
                </div>
            </div>

            {open && (
                <>
                    <PersonIdentityFields namePrefix={prefix}>
                        <Col xs={24} md={12}>
                            <TextInput label="Aadhaar" name={n('aadhaar')} type="text" placeholder="Enter Aadhaar number" maxLength={12} allowNumbersOnly size="large" />
                        </Col>
                        <Col xs={24} md={12}>
                            <TextInput label="Email address" name={n('email')} type="text" placeholder="Enter email" isRequired size="large" />
                        </Col>
                        <Col xs={24} md={12}>
                            <TextInput label="Mobile" name={n('mobile')} type="text" placeholder="+91 000 00 000" maxLength={10} allowNumbersOnly isRequired size="large" />
                        </Col>
                    </PersonIdentityFields>

                    <PersonAddressFields namePrefix={prefix} />

                    <div className="flex justify-end border-t border-[#f1f5f9] pt-3">
                        <SaveProgressButton />
                    </div>
                </>
            )}
        </div>
    );
};

export default PartnerCard;
