import { Button, Checkbox, Col, Collapse, Flex, Grid, Row, Slider, Typography } from 'antd';

import afternoonIcon from '../../assets/icons/afternoonIcon.svg';
import cheapestIcon from '../../assets/icons/cheapestIcon.svg';
import earliestIcon from '../../assets/icons/earliestIcon.svg';
import fastestIcon from '../../assets/icons/fastestIcon.svg';
import morngIcon from '../../assets/icons/morngIcon.svg';
import nightIcon from '../../assets/icons/nightIcon.svg';
import noonIcon from '../../assets/icons/noonIcon.svg';
import { BestOption } from '../../types/buslist';

const { useBreakpoint } = Grid;

const BEST_OPTIONS = [
    { key: 'cheapest' as BestOption, label: 'Cheapest', icon: cheapestIcon },
    { key: 'earliest' as BestOption, label: 'Earliest', icon: earliestIcon },
    { key: 'fastest' as BestOption, label: 'Fastest', icon: fastestIcon },
];

const DEPARTURE_TIMES = [
    { label: 'Morning', time: '00:00 - 11:59', icon: morngIcon },
    { label: 'Noon', time: '12:00 - 14:59', icon: noonIcon },
    { label: 'Afternoon', time: '15:00 - 17:59', icon: afternoonIcon },
    { label: 'Night', time: '18:00 - 23:59', icon: nightIcon },
];

type Props = {
    busTypeFilters: string[];
    activeFilters: string[];
    onToggleFilter: (val: string) => void;
    priceRange: [number, number];
    onPriceChange: (val: [number, number]) => void;
    minPrice: number;
    maxPrice: number;
    bestOption: BestOption;
    onBestOption: (val: BestOption) => void;
    bestOptionDetails: Record<string, string>;
    selectedDeparture: string[];
    onToggleDeparture: (val: string) => void;
    departureCounts: Record<string, number>;
    availableAmenities: string[];
    selectedAmenities: string[];
    onToggleAmenity: (val: string) => void;
    onReset: () => void;
};

export default function FilterSidebar({
    busTypeFilters, activeFilters, onToggleFilter,
    priceRange, onPriceChange,
    minPrice, maxPrice,
    bestOption, onBestOption, bestOptionDetails,
    selectedDeparture, onToggleDeparture, departureCounts,
    availableAmenities, selectedAmenities, onToggleAmenity,
    onReset,
}: Props) {
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const filterBody = (
            <Flex vertical gap={28} style={{ padding: '16px 20px 24px' }}>
                {/* Bus type pills */}
                <Flex vertical gap={12}>
                    <Flex wrap gap={8}>
                        {busTypeFilters.map(f => {
                            const active = activeFilters.includes(f);
                            return (
                                <Button
                                    key={f}
                                    onClick={() => onToggleFilter(f)}
                                    style={{
                                        background: active ? 'rgba(255,79,79,0.08)' : 'white',
                                        borderColor: active ? '#ff4f4f' : '#e1e7ee',
                                        color: active ? '#ff4f4f' : '#545454',
                                        fontWeight: 500,
                                        fontSize: 14,
                                        height: 'auto',
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                    }}
                                >
                                    {f}
                                </Button>
                            );
                        })}
                    </Flex>

                    {/* Price */}
                    <Typography.Text className="text-base font-medium leading-6">Price</Typography.Text>
                    <Slider
                        range
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange}
                        onChange={v => onPriceChange(v as [number, number])}
                    />
                    <Row className="gap-2 flex xl:flex-row md:flex-col">
                        <Col sm={24} className="border border-gray-100 p-2 flex-1 rounded-md">
                            <Flex vertical>
                                <Typography.Text className="text-neutral-400 text-sm font-normal leading-6">Min price</Typography.Text>
                                <Typography.Text className="text-xs font-medium">₹ {priceRange[0].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography.Text>
                            </Flex>
                        </Col>
                        <Col sm={24} className="border border-gray-100 p-2 flex-1 rounded-md">
                            <Flex vertical>
                                <Typography.Text className="text-neutral-400 text-sm font-normal leading-6">Max price</Typography.Text>
                                <Typography.Text className="text-xs font-medium">₹ {priceRange[1].toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typography.Text>
                            </Flex>
                        </Col>
                    </Row>
                </Flex>

                {/* Best option */}
                <Flex vertical gap={10}>
                    <Typography.Text style={{ fontSize: 15, fontWeight: 500, color: '#101010' }}>Best option</Typography.Text>
                    <Flex vertical gap={8}>
                        {BEST_OPTIONS.map(opt => {
                            const active = bestOption === opt.key;
                            const detail = bestOptionDetails[opt.key as string] ?? '';
                            return (
                                <Flex
                                    key={opt.key as string}
                                    gap={12}
                                    align="center"
                                    onClick={() => onBestOption(active ? null : opt.key)}
                                    style={{
                                        padding: '10px 14px',
                                        borderRadius: 6,
                                        border: `1px solid ${active ? '#ff4f4f' : '#e1e7ee'}`,
                                        background: active ? 'rgba(255,79,79,0.08)' : 'white',
                                        cursor: 'pointer',
                                    }}
                                >
                                    <img src={opt.icon} alt={opt.label} style={{ width: 18, height: 18, objectFit: 'contain', flexShrink: 0 }} />
                                    <Flex vertical gap={2}>
                                        <Typography.Text style={{ fontSize: 14, fontWeight: 500, color: active ? '#ff4f4f' : '#3c3c3c', whiteSpace: 'nowrap' }}>
                                            {opt.label}
                                        </Typography.Text>
                                        {detail && (
                                            <Typography.Text style={{ fontSize: 13, color: '#424242' }}>{detail}</Typography.Text>
                                        )}
                                    </Flex>
                                </Flex>
                            );
                        })}
                    </Flex>
                </Flex>

                {/* Departure time */}
                <Flex vertical gap={10}>
                    <Typography.Text style={{ fontSize: 15, fontWeight: 500, color: '#101010' }}>Departure time</Typography.Text>
                    <Flex vertical gap={8}>
                        {[DEPARTURE_TIMES.slice(0, 2), DEPARTURE_TIMES.slice(2)].map((row, rowIdx) => (
                            <Flex key={rowIdx} gap={8}>
                                {row.map(t => {
                                    const active = selectedDeparture.includes(t.label);
                                    return (
                                        <Button
                                            key={t.label}
                                            onClick={() => onToggleDeparture(t.label)}
                                            style={{
                                                flex: 1,
                                                borderColor: active ? '#ff4f4f' : '#cfd9e4',
                                                background: active ? 'rgba(255,79,79,0.08)' : 'white',
                                                height: 'auto',
                                                padding: '10px 8px',
                                                borderRadius: 6,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 4,
                                            }}
                                        >
                                            <img src={t.icon} alt={t.label} style={{ width: 24, height: 24, objectFit: 'contain' }} />
                                            <Typography.Text style={{ fontSize: 13, fontWeight: 500, color: '#333' }}>{t.label}</Typography.Text>
                                            <Typography.Text style={{ fontSize: 11, color: '#333' }}>{t.time}</Typography.Text>
                                            {departureCounts[t.label] !== undefined && (
                                                <Typography.Text style={{ fontSize: 11, color: active ? '#ff4f4f' : '#888' }}>
                                                    {departureCounts[t.label]} buses
                                                </Typography.Text>
                                            )}
                                        </Button>
                                    );
                                })}
                            </Flex>
                        ))}
                    </Flex>
                </Flex>

                {/* Amenities — only shown when API returns amenity data */}
                {availableAmenities.length > 0 && (
                    <Flex vertical gap={10}>
                        <Typography.Text style={{ fontSize: 15, fontWeight: 500, color: '#101010' }}>Amenities</Typography.Text>
                        <Flex vertical gap={10}>
                            {availableAmenities.map(a => (
                                <Flex key={a} gap={10} align="center">
                                    <Checkbox
                                        checked={selectedAmenities.includes(a)}
                                        onChange={() => onToggleAmenity(a)}
                                    />
                                    <Typography.Text style={{ fontSize: 14, color: '#333' }}>{a}</Typography.Text>
                                </Flex>
                            ))}
                        </Flex>
                    </Flex>
                )}
            </Flex>
    );

    if (isMobile) {
        const activeCount = activeFilters.length + selectedDeparture.length;
        return (
            <Collapse
                ghost
                style={{ background: 'white', borderRadius: 8, border: '1px solid #e2e2e2', marginBottom: 8 }}
                items={[{
                    key: 'filters',
                    label: (
                        <Flex justify="space-between" align="center">
                            <Typography.Text style={{ fontSize: 15, fontWeight: 700, color: '#101010' }}>
                                Filters{activeCount > 0 ? ` (${activeCount} active)` : ''}
                            </Typography.Text>
                            {activeCount > 0 && (
                                <Typography.Text
                                    style={{ fontSize: 13, color: '#ff3a3a', cursor: 'pointer' }}
                                    onClick={e => { e.stopPropagation(); onReset(); }}
                                >
                                    Reset
                                </Typography.Text>
                            )}
                        </Flex>
                    ),
                    children: filterBody,
                }]}
            />
        );
    }

    return (
        <Row>
            <Col xs={24}>
                <Flex vertical className="bg-white rounded-lg border">
                    <Flex
                        justify="space-between"
                        align="center"
                        style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0' }}
                    >
                        <Typography.Text style={{ fontSize: 16, fontWeight: 700, color: '#101010' }}>Filter</Typography.Text>
                        <Typography.Text
                            style={{ fontSize: 14, color: '#ff3a3a', cursor: 'pointer' }}
                            onClick={onReset}
                        >
                            Reset
                        </Typography.Text>
                    </Flex>
                    {filterBody}
                </Flex>
            </Col>
        </Row>
    );
}
