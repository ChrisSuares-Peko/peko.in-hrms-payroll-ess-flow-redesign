import { Select } from 'antd';

import { CreditNoteStatus } from '../../types/creditNote';
import { CREDIT_NOTE_STATUS_OPTIONS } from '../../utils/constants/creditNote';

interface Props {
    creditNoteId: string;
    status: CreditNoteStatus;
    onChange: (creditNoteId: string, status: CreditNoteStatus) => Promise<boolean>;
}

// Same hex pairs as CREDIT_NOTE_STATUS_CONFIG / the sibling Invoice Status tag, applied to the
// Select's own selector box so it reads as a colored pill rather than a plain form control.
const SELECT_STATUS_CLASSNAME: Record<CreditNoteStatus, string> = {
    PENDING: '[&_.ant-select-selector]:!bg-[#FFF7ED] [&_.ant-select-selector]:!text-[#F97316]',
    REFUNDED: '[&_.ant-select-selector]:!bg-[#ECFDF5] [&_.ant-select-selector]:!text-[#0D9488]',
};

const CreditNoteStatusSelect = ({ creditNoteId, status, onChange }: Props) => (
    <Select
        size="small"
        value={status ?? 'PENDING'}
        options={CREDIT_NOTE_STATUS_OPTIONS}
        onChange={value => onChange(creditNoteId, value)}
        popupMatchSelectWidth={false}
        className={`w-[112px] [&_.ant-select-selector]:!rounded-full [&_.ant-select-selector]:!border-0 [&_.ant-select-selector]:!px-3 [&_.ant-select-selector]:!font-medium ${SELECT_STATUS_CLASSNAME[status] ?? ''}`}
    />
);

export default CreditNoteStatusSelect;
