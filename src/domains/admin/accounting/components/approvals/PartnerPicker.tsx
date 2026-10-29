import { Select } from 'antd';

import { ApprovalPartner } from '../../types/approvals';
import { partnerLabel } from '../../utils/approvals';

type PartnerPickerProps = {
    partners: ApprovalPartner[];
    value: number | null;
    loading?: boolean;
    onChange: (partnerPermissionId: number) => void;
};

export const partnerOptionLabel = (partner: ApprovalPartner) =>
    `${partnerLabel(partner)} (${partner.counts.awaiting} awaiting)`;

const PartnerPicker = ({ partners, value, loading, onChange }: PartnerPickerProps) => (
    <Select
        showSearch
        optionFilterProp="label"
        loading={loading}
        value={value ?? undefined}
        placeholder="Choose a partner"
        className="w-full sm:w-80"
        onChange={onChange}
        options={partners.map(partner => ({
            value: partner.partnerPermissionId,
            label: partnerOptionLabel(partner),
        }))}
    />
);

export default PartnerPicker;
