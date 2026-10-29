import { Tag, Tooltip } from 'antd';

import { ApprovalDrift } from '../../types/approvals';

export const DRIFT_LABEL = 'Configuration changed since approval';

const DriftTag = ({ drift }: { drift: ApprovalDrift }) => (
    <Tooltip
        title={drift.fields.length ? drift.fields.map(field => field.label).join(', ') : undefined}
    >
        <Tag className="m-0 rounded-full border-0 bg-bgLightYellow text-amber-700">
            {DRIFT_LABEL}
        </Tag>
    </Tooltip>
);

export default DriftTag;
