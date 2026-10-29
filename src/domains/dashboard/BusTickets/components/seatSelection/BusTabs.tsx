import { Flex, Typography } from 'antd';

import ImagesTab from './ImagesTab';
import PolicyTab from './PolicyTab';
import RatingTab from './RatingTab';
import StopItem from './StopItem';
import { StopPoint } from '../../types/buslist';
import { AMENITY_ICONS } from '../../utils/amenityIcons';
import { TABS, type TabKey } from '../../utils/seatSelectionData';

interface BusTabsProps {
    activeTab: TabKey;
    onTabChange: (tab: TabKey) => void;
    boardingPoints: StopPoint[];
    selectedBoardingId: string;
    onBoardingSelect: (id: string) => void;
    dropPoints: StopPoint[];
    selectedDropId: string;
    onDropSelect: (id: string) => void;
    amenities: string[];
    rating?: string;
    ratingsBreakUp?: Record<string, number>;
    totalRatingCount?: string;
    cancellationPolicy?: string;
    imagesMetadataUrl?: string;
    busImageCount?: string;
}

export default function BusTabs({
    activeTab, onTabChange,
    boardingPoints, selectedBoardingId, onBoardingSelect,
    dropPoints, selectedDropId, onDropSelect,
    amenities, rating, ratingsBreakUp, totalRatingCount,
    cancellationPolicy, imagesMetadataUrl, busImageCount,
}: BusTabsProps) {
    return (
        <Flex vertical style={{ background: 'white', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
            <div style={{ borderBottom: '1px solid #f0f0f0', overflowX: 'auto', display: 'flex', flexShrink: 0 }}>
                {TABS.map(tab => {
                    const active = activeTab === tab.key;
                    return (
                        <button
                            type="button"
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            style={{
                                padding: '13px 14px', cursor: 'pointer', whiteSpace: 'nowrap',
                                fontSize: 13, fontWeight: active ? 600 : 400,
                                color: active ? '#ff4f4f' : '#666',
                                transition: 'all 0.12s', flexShrink: 0,
                                background: 'none', border: 'none', borderRadius: 0,
                                borderBottomWidth: 2, borderBottomStyle: 'solid',
                                borderBottomColor: active ? '#ff4f4f' : 'transparent',
                            }}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            <div className="thin-scroll" style={{ overflowY: 'auto', maxHeight: 460 }}>
                {activeTab === 'boarding' && boardingPoints.map(bp => (
                    <StopItem key={bp.id} point={bp} selected={selectedBoardingId === bp.id} onSelect={() => onBoardingSelect(bp.id)} />
                ))}
                {activeTab === 'drop' && dropPoints.map(dp => (
                    <StopItem key={dp.id} point={dp} selected={selectedDropId === dp.id} onSelect={() => onDropSelect(dp.id)} />
                ))}
                {activeTab === 'amenities' && (
                    amenities.length > 0 ? (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', padding: 16 }}>
                            {amenities.map(a => {
                                const icon = AMENITY_ICONS[a.toLowerCase().trim()];
                                return (
                                    <Flex key={a} gap={10} align="center" style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: '10px 12px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', color: '#8c8c8c', flexShrink: 0 }}>
                                            {icon ?? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a' }} />}
                                        </span>
                                        <Typography.Text style={{ fontSize: 13, color: '#333' }}>{a}</Typography.Text>
                                    </Flex>
                                );
                            })}
                        </div>
                    ) : (
                        <Flex align="center" justify="center" style={{ padding: '40px 18px' }}>
                            <Typography.Text style={{ color: '#8c8c8c', fontSize: 13 }}>No amenities information available.</Typography.Text>
                        </Flex>
                    )
                )}
                {activeTab === 'rating' && (
                    <RatingTab rating={rating} ratingsBreakUp={ratingsBreakUp} totalRatingCount={totalRatingCount} />
                )}
                {activeTab === 'policy' && <PolicyTab cancellationPolicy={cancellationPolicy} />}
                {activeTab === 'images' && (
                    <ImagesTab imagesMetadataUrl={imagesMetadataUrl} busImageCount={busImageCount} />
                )}
            </div>
        </Flex>
    );
}
