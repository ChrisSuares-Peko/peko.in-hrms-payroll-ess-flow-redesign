import { useEffect, useState } from 'react';

import { Button, Drawer, Flex, Grid, Typography } from 'antd';
import { BsStar, BsStarFill } from 'react-icons/bs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import icBus from '../../assets/icons/busListIcon.svg';
import icLocation from '../../assets/icons/locationIcon.svg';
import icStar from '../../assets/icons/starratinIcon.svg';
import { BusData } from '../../types/buslist';
import { AMENITY_ICONS } from '../../utils/amenityIcons';
import { formatDuration } from '../../utils/formatDuration';

const { useBreakpoint } = Grid;

type Props = { bus: BusData };

function DurationLabel({ duration, fontSize = 12 }: { duration: string; fontSize?: number }) {
    const formatted = formatDuration(duration);
    const parts = formatted.split(' ');
    return (
        <span style={{ fontSize, color: '#101010', whiteSpace: 'nowrap' }}>
            {parts.map((part, i) => {
                const isUnit = part === 'hr' || part === 'min';
                return (
                    <span key={i} style={{ fontWeight: isUnit ? 400 : 600 }}>
                        {part}{i < parts.length - 1 ? ' ' : ''}
                    </span>
                );
            })}
        </span>
    );
}

function BusThumbnail({ imagesMetadataUrl, busImageCount, size = 48 }: { imagesMetadataUrl?: string; busImageCount?: string; size?: number }) {
    const [src, setSrc] = useState<string | null>(null);

    useEffect(() => {
        const count = parseInt(busImageCount ?? '0', 10);
        if (!imagesMetadataUrl || count <= 0) return;
        fetch(imagesMetadataUrl)
            .then(r => r.json())
            .then((data: any) => {
                let urls: string[] = [];
                if (Array.isArray(data)) {
                    urls = data.map((item: any) => item?.image_url ?? item?.url ?? item).filter((u: any) => typeof u === 'string');
                } else if (data?.bus_image_metadatas) {
                    urls = (data.bus_image_metadatas as any[]).map((item: any) => item?.image_url ?? item?.url).filter(Boolean);
                } else if (data?.images) {
                    urls = (data.images as any[]).map((item: any) => item?.image_url ?? item?.url ?? item).filter((u: any) => typeof u === 'string');
                }
                if (urls[0]) setSrc(urls[0]);
            })
            .catch(() => {});
    }, [imagesMetadataUrl, busImageCount]);

    if (!src) return <img src={icBus} alt="bus" style={{ width: size * 0.6, height: size * 0.6, objectFit: 'contain', flexShrink: 0 }} />;

    return (
        <img
            src={src}
            alt="bus"
            style={{ width: size, height: size, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }}
            onError={() => setSrc(null)}
        />
    );
}

function CancellationPolicyDrawer({ policy, open, onClose }: { policy?: string; open: boolean; onClose: () => void }) {
    const segments = (policy ?? '').split(';').filter(seg => {
        const parts = seg.split(':');
        return parts.length >= 3 && !Number.isNaN(parseInt(parts[0], 10)) && !Number.isNaN(parseInt(parts[2], 10));
    });

    return (
        <Drawer open={open} onClose={onClose} title="Cancellation Policy" placement="right" width={460}>
            {segments.length > 0 ? (
                <Flex vertical gap={0}>
                    <div style={{ background: '#fff7f6', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                        <Typography.Text style={{ fontSize: 12, color: '#666' }}>
                            Charges are calculated based on time remaining before departure.
                        </Typography.Text>
                    </div>
                    <div style={{ borderRadius: 8, border: '1px solid #f0f0f0', overflow: 'hidden' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#f5f5f5', padding: '10px 16px' }}>
                            <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: '#444' }}>Time Before Departure</Typography.Text>
                            <Typography.Text style={{ fontSize: 12, fontWeight: 600, color: '#444', textAlign: 'right' }}>Cancellation Charge</Typography.Text>
                        </div>
                        {segments.map((seg, i) => {
                            const parts = seg.split(':');
                            const fromHrs = parseInt(parts[0], 10);
                            const toHrs = parseInt(parts[1], 10);
                            const charge = parseInt(parts[2], 10);
                            const timeLabel = toHrs === -1 ? `${fromHrs}+ hrs` : `${fromHrs}–${toHrs} hrs`;
                            const chargeLabel = charge === 100 ? 'Non-refundable' : `${charge}% of fare`;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                                        padding: '12px 16px',
                                        borderTop: i > 0 ? '1px solid #f0f0f0' : 'none',
                                        background: charge === 100 ? '#fff5f5' : 'white',
                                    }}
                                >
                                    <Typography.Text style={{ fontSize: 13 }}>{timeLabel}</Typography.Text>
                                    <Typography.Text style={{ fontSize: 13, fontWeight: 500, color: charge === 100 ? '#ff4f4f' : '#2f2f2f', textAlign: 'right' }}>
                                        {chargeLabel}
                                    </Typography.Text>
                                </div>
                            );
                        })}
                    </div>
                </Flex>
            ) : (
                <Typography.Text style={{ color: '#8c8c8c', fontSize: 13 }}>
                    Cancellation policy not available for this bus.
                </Typography.Text>
            )}
        </Drawer>
    );
}


export default function BusCard({ bus }: Props) {
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const isMobile = !screens.lg;
    const [policyDrawerOpen, setPolicyDrawerOpen] = useState(false);

    const handleBookNow = () => {
        const params = new URLSearchParams({
            busId: bus.id,
            operator: bus.operator,
            type: bus.type,
            from: bus.departCity,
            to: bus.arrivalCity,
            departTime: bus.departTime,
            arrivalTime: bus.arrivalTime,
            duration: bus.duration,
            date: bus.departDate,
            price: String(bus.price),
            bpDpSeatLayout: String(bus.bpDpSeatLayout),
        });
        navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.results}/${paths.bus.seatSelection}?${params}`);
    };

    if (isMobile) {
        return (
            <Flex className="my-2 mx-2" style={{ position: 'relative' }}>
                <Flex vertical style={{ borderRadius: 11, overflow: 'hidden', background: 'white', width: '100%' }}>
                    {/* Top: operator + price */}
                    <Flex justify="space-between" align="center" style={{ background: '#fff7f6', padding: '12px 14px', gap: 8 }}>
                        <Flex align="center" gap={10}>
                            <BusThumbnail imagesMetadataUrl={bus.imagesMetadataUrl} busImageCount={bus.busImageCount} size={40} />
                            <Flex vertical gap={2}>
                                <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: '#101010' }}>{bus.operator}</Typography.Text>
                                <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{bus.type}</Typography.Text>
                            </Flex>
                        </Flex>
                        <Flex vertical align="flex-end" gap={2}>
                            {bus.originalPrice > bus.price && (
                                <Typography.Text style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', textDecoration: 'line-through' }}>
                                    ₹{bus.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography.Text>
                            )}
                            <Typography.Text style={{ fontSize: screens.sm ? 20 : 15, fontWeight: 700, color: '#101010', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                                ₹{bus.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>Onwards</Typography.Text>
                        </Flex>
                    </Flex>

                    {/* Departure | Duration | Arrival */}
                    <Flex align="center" style={{ padding: '14px 14px 10px' }}>
                        <Flex vertical align="center" gap={2} style={{ flex: '0 0 auto', minWidth: 80 }}>
                            <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{bus.departCity.split(',')[0]}</Typography.Text>
                            <Typography.Text style={{ fontSize: 22, fontWeight: 600, color: '#101010', lineHeight: 1.2 }}>{bus.departTime}</Typography.Text>
                            <Typography.Text style={{ fontSize: 10, color: '#8c8c8c' }}>{bus.departDate}</Typography.Text>
                        </Flex>

                        <Flex flex={1} justify="center" align="center">
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(246, 238, 251, 1)', flexShrink: 0, display: 'block' }} />
                            <div style={{ flex: 1, borderTop: '0.5px dashed #e0e0e0' }} />
                            <Flex align="center" style={{ background: 'rgba(246, 238, 251, 1)', padding: '2px 8px', borderRadius: 20 }}>
                                <DurationLabel duration={bus.duration} fontSize={11} />
                            </Flex>
                            <div style={{ flex: 1, borderTop: '0.5px dashed #e0e0e0' }} />
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(246, 238, 251, 1)', flexShrink: 0, display: 'block' }} />
                        </Flex>

                        <Flex vertical align="center" gap={2} style={{ flex: '0 0 auto', minWidth: 80 }}>
                            <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{bus.arrivalCity.split(',')[0]}</Typography.Text>
                            <Typography.Text style={{ fontSize: 22, fontWeight: 600, color: '#101010', lineHeight: 1.2 }}>{bus.arrivalTime}</Typography.Text>
                            <Typography.Text style={{ fontSize: 10, color: '#8c8c8c' }}>{bus.arrivalDate}</Typography.Text>
                        </Flex>
                    </Flex>

                    {/* Divider */}
                    <div style={{ height: 1, background: '#f0f0f0', marginInline: 14 }} />

                    {/* Bottom: rating + seats + amenities + Book Now */}
                    <Flex justify="space-between" align="center" style={{ padding: '10px 14px' }} gap={8}>
                        <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
                            {bus.rating > 0 && (
                                <Flex gap={4} align="center">
                                    <Typography.Text style={{ fontSize: 13, fontWeight: 700, color: '#43b75d' }}>{bus.rating}</Typography.Text>
                                    <img src={icStar} alt="star" style={{ width: 13, height: 13 }} />
                                    <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{bus.ratings.toLocaleString()} ratings</Typography.Text>
                                </Flex>
                            )}
                            {(bus.seats > 0 || bus.single > 0) && (
                                <Flex gap={8} align="center">
                                    {bus.seats > 0 && <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>{bus.seats} seats</Typography.Text>}
                                    {bus.single > 0 && <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>{bus.single} single</Typography.Text>}
                                </Flex>
                            )}
                            {bus.liveTracking && (
                                <Flex gap={4} align="center">
                                    <img src={icLocation} alt="location" style={{ width: 12, height: 12 }} />
                                    <Typography.Text style={{ fontSize: 12, color: '#43b75d' }}>Live tracking</Typography.Text>
                                </Flex>
                            )}
                            {bus.amenities.length > 0 && (
                                <Flex gap={4} wrap="wrap" style={{ marginTop: 2 }}>
                                    {bus.amenities.slice(0, 3).map(amenity => (
                                        <span key={amenity} style={{ fontSize: 10, color: '#595959', background: '#f5f5f5', border: '1px solid #e8e8e8', borderRadius: 4, padding: '1px 5px', whiteSpace: 'nowrap' }}>
                                            {amenity}
                                        </span>
                                    ))}
                                    {bus.amenities.length > 3 && (
                                        <span style={{ fontSize: 10, color: '#ff4f4f', background: '#fff7f6', border: '1px solid #ffccc7', borderRadius: 4, padding: '1px 5px' }}>
                                            +{bus.amenities.length - 3} more
                                        </span>
                                    )}
                                </Flex>
                            )}
                        </Flex>
                        <Button
                            type="primary"
                            onClick={handleBookNow}
                            style={{ background: '#ff4f4f', borderColor: '#ff3a3a', width: 100, height: 36, borderRadius: 8, fontSize: 13, fontWeight: 600, flexShrink: 0 }}
                        >
                            Book Now
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        );
    }

    return (
        <><Flex className="my-2 mx-4">
            <Flex vertical style={{ borderRadius: 11, background: 'white', width: '100%', overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>

                {/* Top row: operator + rating */}
                <Flex justify="space-between" align="center" style={{ padding: '16px 20px 14px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                    <Flex align="center" gap={10}>
                        <BusThumbnail imagesMetadataUrl={bus.imagesMetadataUrl} busImageCount={bus.busImageCount} size={52} />
                        <Typography.Text style={{ fontSize: 14, fontWeight: 600, color: '#101010' }}>
                            {bus.operator}
                            {bus.type ? <span style={{ fontWeight: 400, color: '#8c8c8c' }}> - {bus.type}</span> : null}
                        </Typography.Text>
                    </Flex>
                    {bus.rating > 0 && (
                        <Flex align="center" gap={6}>
                            <Flex gap={2} align="center">
                                {[1, 2, 3, 4, 5].map(s => (
                                    s <= Math.round(bus.rating)
                                        ? <BsStarFill key={s} size={13} color="#faad14" />
                                        : <BsStar key={s} size={13} color="#d9d9d9" />
                                ))}
                            </Flex>
                            <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>({bus.ratings.toLocaleString()} reviews)</Typography.Text>
                        </Flex>
                    )}
                </Flex>

                {/* Middle row: route + price */}
                <Flex align="center" justify="space-between" style={{ padding: '20px 20px' }}>
                    {/* Departure */}
                    <Flex vertical gap={2} style={{ flex: '0 0 110px' }}>
                        <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>{bus.departCity.split(',')[0]}</Typography.Text>
                        <Typography.Text style={{ fontSize: 26, fontWeight: 600, color: '#101010', lineHeight: 1.2 }}>{bus.departTime}</Typography.Text>
                        <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{bus.departDate}</Typography.Text>
                    </Flex>

                    {/* Timeline */}
                    <Flex align="center" justify="center" style={{ flex: '0 0 210px' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(246, 238, 251, 1)', flexShrink: 0 }} />
                        <div style={{ flex: 1, borderTop: '1px dashed #e0e0e0' }} />
                        <Flex align="center" style={{ background: 'rgba(246, 238, 251, 1)', padding: '2px 6px', borderRadius: 20 }}>
                            <DurationLabel duration={bus.duration} fontSize={11} />
                        </Flex>
                        <div style={{ flex: 1, borderTop: '1px dashed #e0e0e0' }} />
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(246, 238, 251, 1)', flexShrink: 0 }} />
                    </Flex>

                    {/* Arrival */}
                    <Flex vertical gap={2} style={{ flex: '0 0 110px' }}>
                        <Typography.Text style={{ fontSize: 12, color: '#8c8c8c' }}>{bus.arrivalCity.split(',')[0]}</Typography.Text>
                        <Typography.Text style={{ fontSize: 26, fontWeight: 600, color: '#101010', lineHeight: 1.2 }}>{bus.arrivalTime}</Typography.Text>
                        <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>{bus.arrivalDate}</Typography.Text>
                    </Flex>

                    {/* Price + Book Now */}
                    <Flex vertical align="center" gap={6} style={{ flexShrink: 0 }}>
                        {bus.originalPrice > bus.price && (
                            <Typography.Text style={{ fontSize: 12, color: 'rgba(0,0,0,0.35)', textDecoration: 'line-through' }}>
                                ₹{bus.originalPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </Typography.Text>
                        )}
                        <Typography.Text style={{ fontSize: 22, fontWeight: 700, color: '#101010', lineHeight: 1.2 }}>
                            ₹{bus.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </Typography.Text>
                        <Button
                            type="primary"
                            onClick={handleBookNow}
                            style={{ background: '#ff4f4f', borderColor: '#ff3a3a', width: 120, height: 42, borderRadius: 6, fontSize: 13, fontWeight: 600 }}
                        >
                            Book Now
                        </Button>
                        {bus.amenities.length === 0 && !bus.liveTracking && (
                            <Typography.Text
                                style={{ fontSize: 12, color: '#ff4f4f', cursor: 'pointer' }}
                                onClick={() => setPolicyDrawerOpen(true)}
                            >
                                Cancellation Policy
                            </Typography.Text>
                        )}
                    </Flex>
                </Flex>

                {/* Bottom row: amenities + cancellation policy */}
                {bus.amenities.length > 0 || bus.liveTracking ? (
                    <Flex
                        align="center"
                        justify="space-between"
                        style={{ margin: '0 16px 16px', padding: '10px 14px', border: '1px solid #d0d0d0', borderRadius: 16 }}
                        gap={8}
                    >
                        <Flex align="center" gap={0} wrap="wrap" style={{ flex: 1, minWidth: 0 }}>
                            {bus.liveTracking && (
                                <>
                                    <Flex gap={4} align="center">
                                        <img src={icLocation} alt="" style={{ width: 13, height: 13, objectFit: 'contain' }} />
                                        <Typography.Text style={{ fontSize: 11, color: '#43b75d' }}>Live tracking</Typography.Text>
                                    </Flex>
                                    {bus.amenities.length > 0 && <Typography.Text style={{ fontSize: 11, color: '#d9d9d9', margin: '0 14px' }}>|</Typography.Text>}
                                </>
                            )}
                            {bus.amenities.map((amenity, idx) => {
                                const icon = AMENITY_ICONS[amenity.toLowerCase().trim()];
                                return (
                                    <Flex key={amenity} align="center" gap={0}>
                                        <Flex align="center" gap={4} style={{ color: '#595959' }}>
                                            {icon && <span style={{ display: 'flex', alignItems: 'center', color: '#8c8c8c' }}>{icon}</span>}
                                            <Typography.Text style={{ fontSize: 11, color: '#595959' }}>{amenity}</Typography.Text>
                                        </Flex>
                                        {idx < bus.amenities.length - 1 && (
                                            <Typography.Text style={{ fontSize: 11, color: '#d9d9d9', margin: '0 14px' }}>|</Typography.Text>
                                        )}
                                    </Flex>
                                );
                            })}
                        </Flex>
                        <Typography.Text
                            style={{ fontSize: 12, color: '#ff4f4f', cursor: 'pointer', flexShrink: 0 }}
                            onClick={() => setPolicyDrawerOpen(true)}
                        >
                            Cancellation Policy
                        </Typography.Text>
                    </Flex>
                ) : null}

            </Flex>
        </Flex><CancellationPolicyDrawer
                policy={bus.cancellationPolicy}
                open={policyDrawerOpen}
                onClose={() => setPolicyDrawerOpen(false)} /></>
    );
}
