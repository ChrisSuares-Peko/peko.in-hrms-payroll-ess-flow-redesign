import React from 'react';

import { Flex, Tooltip, Typography } from 'antd';

import { retrieveAirportName } from '../utils/airlineData';
import { formatDurationToHourMinute } from '../utils/formatDateCode';

interface Props {
    segments: any[];
    children: React.ReactNode;
}

const LayoverTooltip = ({ segments, children }: Props) => {
    const layovers = (segments ?? [])
        .slice(1)
        .map((seg: any, idx: number) => {
            const code = seg?.Origin?.Airport?.AirportCode;
            const cityName = seg?.Origin?.Airport?.CityName;
            const airportName = seg?.Origin?.Airport?.AirportName || retrieveAirportName(code);
            let durationMinutes = seg?.GroundTime;
            if (!durationMinutes) {
                const prevSeg = segments[idx];
                if (prevSeg?.Destination?.ArrTime && seg?.Origin?.DepTime) {
                    durationMinutes = Math.round(
                        (new Date(seg.Origin.DepTime).getTime() -
                            new Date(prevSeg.Destination.ArrTime).getTime()) /
                            60000
                    );
                }
            }
            return {
                code,
                name: cityName || airportName || code || '',
                duration: durationMinutes > 0 ? formatDurationToHourMinute(durationMinutes) : '',
            };
        })
        .filter(l => l.code && l.duration);

    if (layovers.length === 0) return <>{children}</>;

    const content = (
        <Flex vertical gap={8} className="py-1">
            {layovers.map(l => (
                <Flex vertical key={l.code}>
                    <Typography.Text className="text-xs text-gray-400">Plane change</Typography.Text>
                    <Typography.Text className="text-xs font-medium text-white">
                        {l.name} ({l.code}) | {l.duration} Layover
                    </Typography.Text>
                </Flex>
            ))}
        </Flex>
    );

    return (
        <Tooltip title={content} placement="top">
            {children}
        </Tooltip>
    );
};

export default LayoverTooltip;
