import { Flex } from 'antd';

import { InspectionBookingResult } from '../../types/index';
import OrderDetailsGrid, { DetailItem } from '../shared/OrderDetailsGrid';
import ReportSectionCard from '../shared/ReportSectionCard';
import VehicleHeroStrip from '../shared/VehicleHeroStrip';

interface Props {
    booking: InspectionBookingResult;
    vehicleModel: string;
    bodyType?: string;
}

// "Inspection Booking" card on an inspection order.
//
// Unlike the valuation and history cards this shows what was *requested*, not what a vendor
// returned — Droom's eco-orders endpoint gives back no booking body, so the slots and
// address here are the customer's own choices, captured at purchase.
const InspectionResultCard = ({ booking, vehicleModel, bodyType }: Props) => {
    const items: DetailItem[] = [
        { label: 'Preferred slot 1', value: booking.slot1 },
        // Slot 2 is optional on the form; omitted rather than shown blank.
        ...(booking.slot2 ? [{ label: 'Preferred slot 2', value: booking.slot2 }] : []),
        { label: 'Inspection address', value: booking.address },
    ];

    return (
        <ReportSectionCard title="Inspection Booking">
            <Flex vertical gap={24}>
                <VehicleHeroStrip modelName={vehicleModel} bodyType={bodyType} />
                <OrderDetailsGrid items={items} columns={2} />
            </Flex>
        </ReportSectionCard>
    );
};

export default InspectionResultCard;
