import { Divider, Typography } from 'antd';

import { formatDurationToHourMinute } from '../utils/formatDateCode';

interface Props {
    nextSegment: any;
    prevSegment?: any;
}

const LayoverDivider = ({ nextSegment, prevSegment }: Props) => {
    if (!nextSegment) return null;

    const airport = nextSegment?.Origin?.Airport;
    if (!airport) return null;

    let layoverMinutes = nextSegment.GroundTime;
    if (!layoverMinutes && prevSegment?.Destination?.ArrTime && nextSegment?.Origin?.DepTime) {
        layoverMinutes = Math.round(
            (new Date(nextSegment.Origin.DepTime).getTime() -
                new Date(prevSegment.Destination.ArrTime).getTime()) /
                60000
        );
    }
    if (!Number.isFinite(layoverMinutes) || layoverMinutes <= 0) return null;

    const locationName = airport.CityName || airport.AirportName || airport.AirportCode || '';
    const country = airport.CountryName ? `, ${airport.CountryName}` : '';

    return (
        <Divider dashed className="w-full">
            <Typography.Text className="text-gray-400 text-sm font-normal w-full">
                {formatDurationToHourMinute(layoverMinutes)} Layover in {locationName}
                {country}
            </Typography.Text>
        </Divider>
    );
};

export default LayoverDivider;
