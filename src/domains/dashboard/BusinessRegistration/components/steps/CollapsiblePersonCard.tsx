import { useEffect, useState } from 'react';

import { DeleteOutlined, DownOutlined, UpOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { getIn, useFormikContext } from 'formik';

import SaveProgressButton from './SaveProgressButton';
import StandardPersonFields from './StandardPersonFields';

const { Text } = Typography;

interface CollapsiblePersonCardProps {
    label: string;
    index: number;
    namePrefix: string;
    canRemove: boolean;
    onRemove: () => void;
}

// Generic collapsible/removable person card used by FieldArrays (directors,
// shareholders). Header label + numbered badge; body is the standard KYC fields.
const CollapsiblePersonCard = ({
    label,
    index,
    namePrefix,
    canRemove,
    onRemove,
}: CollapsiblePersonCardProps) => {
    const [open, setOpen] = useState(true);
    const { errors, status } = useFormikContext<Record<string, unknown>>();
    const validationAttempt = (status as { validationAttempt?: number } | undefined)
        ?.validationAttempt;

    // A failed "Next" (validationAttempt bump) expands collapsed cards whose
    // fields have errors so the messages are actually visible. Deliberately not
    // keyed on `errors` — typing elsewhere must never reopen a card the user
    // collapsed on purpose.
    useEffect(() => {
        if (validationAttempt && getIn(errors, `${namePrefix}.${index}`)) setOpen(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [validationAttempt]);

    return (
        <div className="border border-[#e4e4e7] rounded-[24px] p-4 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Text className="!text-[16px] !font-semibold !text-[#1e293b]">{label}</Text>
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
                    <StandardPersonFields namePrefix={`${namePrefix}.${index}`} />
                    <div className="flex justify-end border-t border-[#f1f5f9] pt-3">
                        <SaveProgressButton />
                    </div>
                </>
            )}
        </div>
    );
};

export default CollapsiblePersonCard;
