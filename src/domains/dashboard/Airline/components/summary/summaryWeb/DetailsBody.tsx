import { Flex } from 'antd';

import FlightCard from './FlightCard';

function DetailsBody({
    selectedAirline,
    selectedInbountAirline,
}: {
    selectedAirline: any;
    selectedInbountAirline: any;
}) {
    return (
        <Flex className="w-full" vertical>
            <FlightCard
                selectedAirline={selectedAirline}
                selectedInbountAirline={selectedInbountAirline}
            />
        </Flex>
    );
}

export default DetailsBody;
