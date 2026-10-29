import { Flex } from 'antd';

import FlightCardSm from './FlightCardSm';
import { SelectedAirline } from '../../../types/slices';

function DetailsBodySm({
    selectedAirline,
    selectedInbountAirline,
}: {
    selectedAirline: SelectedAirline;
    selectedInbountAirline: SelectedAirline;
}) {
    return (
        <Flex className="w-full" vertical>
            <FlightCardSm
                selectedAirline={selectedAirline}
                selectedInbountAirline={selectedInbountAirline}
            />
        </Flex>
    );
}

export default DetailsBodySm;
