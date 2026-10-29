import { Flex } from 'antd';

import PriceBandCards from './PriceBandCards';
import { ValuationResult } from '../../types/index';
import ReportSectionCard from '../shared/ReportSectionCard';
import VehicleHeroStrip from '../shared/VehicleHeroStrip';

interface Props {
    result: ValuationResult;
    bodyType?: string;
}

// "Fair Market Value" card: vehicle hero over the price bands. The PDF download lives
// in the page header; bands are absent when OBV could not price the spec.
const ValuationResultCard = ({ result, bodyType }: Props) => (
    <ReportSectionCard title="Fair Market Value">
        <Flex vertical gap={24}>
            <VehicleHeroStrip
                modelName={result.modelName}
                bodyType={bodyType}
                meta={[result.year, result.kilometres, result.city]}
            />
            {!!result.bands?.length && <PriceBandCards bands={result.bands} />}
        </Flex>
    </ReportSectionCard>
);

export default ValuationResultCard;
