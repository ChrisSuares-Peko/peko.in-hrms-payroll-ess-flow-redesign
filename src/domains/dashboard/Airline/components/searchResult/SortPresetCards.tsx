import { useMemo } from 'react';

import { Flex, Typography } from 'antd';
import { ReactSVG } from 'react-svg';

import cheapestIcon from '@src/domains/dashboard/Airline/assets/icons/cheapest.svg';
import fastestIcon from '@src/domains/dashboard/Airline/assets/icons/fastest.svg';
import nonStopIcon from '@src/domains/dashboard/Airline/assets/icons/non-stop-first.svg';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import { Flight } from '../../types/Flight';

const { Text } = Typography;

export type SortPreset = 'cheapest' | 'nonstop' | 'fastest' | null;

interface Props {
    data: Flight[];
    selected: SortPreset;
    onSelect: (preset: SortPreset) => void;
}

const formatDurationFromMinutes = (mins: number) => {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} hrs ${m} mins`;
};

const minByPrice = (flights: Flight[]) =>
    flights.reduce<Flight | undefined>((min, f) => {
        if (!Number.isFinite(f?.price)) return min;
        if (!min || f.price < min.price) return f;
        return min;
    }, undefined);

const minByDuration = (flights: Flight[]) =>
    flights.reduce<{ flight: Flight; mins: number } | undefined>((min, f) => {
        // flightDuration is already in minutes in the IN version
        const mins = f?.flightDuration || 0;
        if (!mins) return min;
        if (!min || mins < min.mins) return { flight: f, mins };
        return min;
    }, undefined);

interface CardProps {
    title: string;
    iconSrc: string;
    price?: number;
    durationLabel?: string;
    selected: boolean;
    disabled?: boolean;
    onClick: () => void;
}

const injectSvg = (svg: SVGSVGElement) => {
    svg.querySelectorAll('path').forEach(p => p.setAttribute('fill', 'currentColor'));
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.setAttribute('style', 'width: 28px; height: 28px;');
};

const PresetCard = ({
    title,
    iconSrc,
    price,
    durationLabel,
    selected,
    disabled,
    onClick,
}: CardProps) => {
    const subtitle = disabled
        ? 'Not available'
        : `₹ ${price !== undefined ? formatNumberWithLocalString(price) : '—'} ・ ${durationLabel || '—'}`;

    return (
        <Flex
            align="center"
            gap={10}
            onClick={() => !disabled && onClick()}
            className={`bg-white rounded-[12px] border-solid overflow-hidden px-[6px] shadow-[0_1px_2px_0_rgba(16,24,40,0.05)] transition-colors ${
                disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:border-[#ff6565] hover:border-[1px]'
            } ${selected ? 'border-[#ff6565] border-[1px]' : 'border-[#e2e2e2] border-[0.5px]'}`}
            style={{ height: 60 }}
        >
            <Flex
                align="center"
                justify="center"
                className={`shrink-0 rounded-[8.5px] ${
                    selected ? 'bg-[#fff7f7] text-[#ff6565]' : 'bg-[#f8f8f8] text-[#c3c3c3]'
                }`}
                style={{ width: 52, height: 48 }}
            >
                <ReactSVG src={iconSrc} beforeInjection={injectSvg} />
            </Flex>
            <Flex vertical className="min-w-0 gap-[6px]">
                <Text className="text-[13px] font-semibold leading-[14px] text-black">{title}</Text>
                <Text className="text-[10px] text-[#5e5e5e] leading-[14px] truncate">
                    {subtitle}
                </Text>
            </Flex>
        </Flex>
    );
};

const SortPresetCards = ({ data, selected, onSelect }: Props) => {
    const cheapest = useMemo(() => minByPrice(data || []), [data]);
    const cheapestNonStop = useMemo(
        () => minByPrice((data || []).filter(f => f?.stopCount === 0)),
        [data]
    );
    const fastest = useMemo(() => minByDuration(data || []), [data]);

    return (
        <Flex vertical gap={14} className="my-4">
            <PresetCard
                title="Cheapest"
                iconSrc={cheapestIcon}
                price={cheapest?.price}
                durationLabel={formatDurationFromMinutes(cheapest?.flightDuration || 0)}
                selected={selected === 'cheapest'}
                disabled={!cheapest}
                onClick={() => onSelect('cheapest')}
            />
            <PresetCard
                title="Non Stop First"
                iconSrc={nonStopIcon}
                price={cheapestNonStop?.price}
                durationLabel={formatDurationFromMinutes(cheapestNonStop?.flightDuration || 0)}
                selected={selected === 'nonstop'}
                disabled={!cheapestNonStop}
                onClick={() => onSelect('nonstop')}
            />
            <PresetCard
                title="Fastest"
                iconSrc={fastestIcon}
                price={fastest?.flight?.price}
                durationLabel={formatDurationFromMinutes(fastest?.mins ?? 0)}
                selected={selected === 'fastest'}
                disabled={!fastest}
                onClick={() => onSelect('fastest')}
            />
        </Flex>
    );
};

export default SortPresetCards;
