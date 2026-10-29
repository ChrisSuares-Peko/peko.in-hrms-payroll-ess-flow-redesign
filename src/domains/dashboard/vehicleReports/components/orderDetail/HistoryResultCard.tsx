import { Flex } from 'antd';

import { HistoryResult } from '../../types/index';
import OrderDetailsGrid, { DetailItem } from '../shared/OrderDetailsGrid';
import ReportSectionCard from '../shared/ReportSectionCard';
import VehicleHeroStrip from '../shared/VehicleHeroStrip';

interface Props {
    result: HistoryResult;
    bodyType?: string;
}

// "Vehicle History" card on a history order. Every value is already a display string —
// the backend normalises Droom's RC payload (DROOM_MYBIZ_API_REFERENCE.md §4) into
// HistoryResult, including the date reformatting and the "NA" sentinels, so nothing is
// reinterpreted here.
const HistoryResultCard = ({ result, bodyType }: Props) => {
    const items: DetailItem[] = [
        { label: 'Registration no.', value: result.registrationNumber },
        { label: 'Ownership', value: result.ownership },
        { label: 'Registered', value: result.registration },
        { label: 'Insurance', value: result.insurance },
        { label: 'PUC', value: result.puc },
        { label: 'Blacklist', value: result.blacklist },
        { label: 'Hypothecation', value: result.hypothecation },
        // Only rendered once the challan API is merged in — the RC endpoint does not
        // return challans, and an empty "Challans" cell reads as "none found", which
        // would be a claim we cannot make.
        ...(result.challans ? [{ label: 'Challans', value: result.challans }] : []),
    ];

    return (
        <ReportSectionCard title="Vehicle History">
            <Flex vertical gap={24}>
                <VehicleHeroStrip
                    modelName={result.modelName}
                    bodyType={bodyType ?? result.bodyType}
                    meta={[result.fuelType, result.bodyType].filter(Boolean) as string[]}
                />
                <OrderDetailsGrid items={items} columns={2} />
            </Flex>
        </ReportSectionCard>
    );
};

export default HistoryResultCard;
