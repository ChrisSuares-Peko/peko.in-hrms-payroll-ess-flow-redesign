import React, { useState } from 'react';

import { ManOutlined, WomanOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import icDriver from '../assets/icons/dashboardIcon.svg';
import type { DeckRow, Seat, SeatStatus } from '../utils/mapTripDetails';

const S = (id: string, number: number, status: SeatStatus, price: number) =>
    ({ id, number, status, price, width: 1, length: 1 });

const LOWER_DECK: DeckRow[] = [
    { row: 1, cols: { 0: S('L1', 1, 'available', 950), 2: S('L2', 2, 'female', 950) } },
    { row: 2, cols: { 0: S('L3', 4, 'sold', 950), 1: S('L4', 5, 'available', 950), 2: S('L5', 6, 'female', 950) } },
    { row: 3, cols: { 0: S('L6', 7, 'male', 950), 1: S('L7', 8, 'sold', 950), 2: S('L8', 9, 'available', 950) } },
    { row: 4, cols: { 0: S('L9', 10, 'female', 950), 1: S('L10', 11, 'available', 950), 2: S('L11', 12, 'sold', 950) } },
    { row: 5, cols: { 0: S('L12', 13, 'sold', 950), 1: S('L13', 14, 'available', 950), 2: S('L14', 15, 'male', 950) } },
];

const UPPER_DECK: DeckRow[] = [
    { row: 1, cols: { 0: S('U1', 1, 'available', 950), 1: S('U2', 2, 'available', 950), 2: S('U3', 3, 'female', 950) } },
    { row: 2, cols: { 0: S('U4', 4, 'sold', 950), 1: S('U5', 5, 'available', 950), 2: S('U6', 6, 'female', 950) } },
    { row: 3, cols: { 0: S('U7', 7, 'male', 950), 1: S('U8', 8, 'sold', 950), 2: S('U9', 9, 'available', 950) } },
    { row: 4, cols: { 0: S('U10', 10, 'female', 950), 1: S('U11', 11, 'available', 950), 2: S('U12', 12, 'sold', 950) } },
    { row: 5, cols: { 0: S('U13', 13, 'sold', 950), 1: S('U14', 14, 'available', 950), 2: S('U15', 15, 'male', 950) } },
];

type PriceFilter = 'all' | 'lower' | 'upper';

function deckMinPrice(rows: DeckRow[]): number | null {
    const prices = rows.flatMap(r => Object.values(r.cols).map(s => s.price));
    return prices.length ? Math.min(...prices) : null;
}

// body bg / strip bg / border / text color
const SEAT_STYLE: Record<SeatStatus | 'selected', [string, string, string, string]> = {
    available: ['#ffffff', '#81CF92', '#81CF92', '#333333'],
    sold:      ['#eeeeee', '#bdbdbd', '#bdbdbd', '#9e9e9e'],
    selected:  ['#81CF92', '#81CF92', '#81CF92', '#ffffff'],
    female:    ['#FDF0FF', '#F4BAFF', '#F4BAFF', '#F4BAFF'],
    male:      ['#EEF0FF', '#9AA9FF', '#9AA9FF', '#9AA9FF'],
};

const LEGEND = [
    { label: 'Available', key: 'available' as const },
    { label: 'Sold',      key: 'sold'      as const },
    { label: 'Selected',  key: 'selected'  as const },
    { label: 'Female',    key: 'female'    as const },
    { label: 'Male',      key: 'male'      as const },
];

export interface Props {
    selectedSeats: string[];
    onSeatToggle: (seatId: string, price: number, seatName: string, ladiesSeat: boolean) => void;
    lowerDeck?: DeckRow[];
    upperDeck?: DeckRow[];
}

const SEAT_W = 44;
const SEAT_H = 82;

// width=1 → seater (square 44×44), width=2 → sleeper (portrait 44×82)
function seatDims(apiWidth: number): { w: number; h: number } {
    return apiWidth === 2 ? { w: SEAT_W, h: SEAT_H } : { w: SEAT_W, h: SEAT_W };
}

function SeatBox({ seat, isSelected, onToggle }: { seat: Seat; isSelected: boolean; onToggle: () => void }) {
    const styleKey = isSelected ? 'selected' : seat.status;
    const [bodyBg, stripBg, border, textColor] = SEAT_STYLE[styleKey];
    const clickable = seat.status !== 'sold';
    const { w, h } = seatDims(seat.width);

    let seatContent: React.ReactNode;
    if (seat.status === 'female' && !isSelected) {
        seatContent = <WomanOutlined style={{ fontSize: 18, color: textColor }} />;
    } else if (seat.status === 'male' && !isSelected) {
        seatContent = <ManOutlined style={{ fontSize: 18, color: textColor }} />;
    } else {
        seatContent = (
            <Typography.Text
                ellipsis
                style={{ fontSize: 13, fontWeight: 600, color: textColor, userSelect: 'none', maxWidth: w - 10, textAlign: 'center' }}
            >
                {String(seat.number).slice(0, 6)}
            </Typography.Text>
        );
    }

    return (
        <Flex vertical align="center" gap={3} style={{ width: w, flexShrink: 0 }}>
            <div
                role="button"
                tabIndex={clickable ? 0 : -1}
                onClick={clickable ? onToggle : undefined}
                onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onToggle(); } : undefined}
                style={{
                    width: w, height: h, borderRadius: 10,
                    background: bodyBg,
                    border: `1.5px solid ${border}`,
                    cursor: clickable ? 'pointer' : 'not-allowed',
                    boxShadow: isSelected ? '0 2px 8px rgba(56,142,60,0.35)' : undefined,
                    transition: 'box-shadow 0.12s',
                    position: 'relative',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
            >
                {seatContent}
                <div style={{
                    position: 'absolute', bottom: 7, left: 5, right: 5,
                    height: 5, borderRadius: 3, background: stripBg,
                }} />
            </div>
            <Typography.Text style={{ fontSize: 9, color: '#888' }}>
                {seat.status === 'sold' && !isSelected ? 'Sold' : `₹${seat.price}`}
            </Typography.Text>
        </Flex>
    );
}

function EmptyCell({ w, h }: { w: number; h: number }) {
    return <div style={{ width: w, height: h + 16, flexShrink: 0 }} />;
}

function DeckGrid({ rows, selectedSeats, onSeatToggle }: {
    rows: DeckRow[];
    selectedSeats: string[];
    onSeatToggle: (id: string, price: number, seatName: string, ladiesSeat: boolean) => void;
}) {
    const allCols = Array.from(
        new Set(rows.flatMap(r => Object.keys(r.cols).map(Number)))
    ).sort((a, b) => a - b);

    const hasAisleBefore = (colIdx: number): boolean => {
        const pos = allCols.indexOf(colIdx);
        return pos > 0 && allCols[pos] - allCols[pos - 1] > 1;
    };

    // Visual dimensions for a column driven by the widest seat type found in it
    const colDims = (col: number): { w: number; h: number } => {
        const maxApiWidth = Math.max(...rows.map(r => r.cols[col]?.width ?? 1));
        return seatDims(maxApiWidth);
    };

    return (
        <Flex vertical gap={4}>
            {/* Dynamic column headers */}
            <Flex align="center" gap={6}>
                {allCols.map((col, i) => (
                    <div
                        key={col}
                        style={{ width: colDims(col).w, textAlign: 'center', flexShrink: 0, marginLeft: hasAisleBefore(col) ? 10 : 0 }}
                    >
                        <Typography.Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                            {String.fromCharCode(65 + i)}
                        </Typography.Text>
                    </div>
                ))}
            </Flex>

            {rows.map(row => (
                <Flex key={row.row} align="flex-start" gap={6}>
                    {allCols.map(col => {
                        const seat = row.cols[col];
                        const { w, h } = colDims(col);
                        return (
                            <div key={col} style={{ marginLeft: hasAisleBefore(col) ? 10 : 0, flexShrink: 0 }}>
                                {seat
                                    ? <SeatBox
                                        seat={seat}
                                        isSelected={selectedSeats.includes(seat.id)}
                                        onToggle={() => onSeatToggle(seat.id, seat.price, String(seat.number), seat.status === 'female')}
                                      />
                                    : <EmptyCell w={w} h={h} />
                                }
                            </div>
                        );
                    })}
                </Flex>
            ))}
        </Flex>
    );
}

function DeckContainer({ title, rows, selectedSeats, onSeatToggle, showDriver }: {
    title: string;
    rows: DeckRow[];
    selectedSeats: string[];
    onSeatToggle: (id: string, price: number, seatName: string, ladiesSeat: boolean) => void;
    showDriver?: boolean;
}) {
    return (
        <div style={{ border: '1px solid #e8e8e8', borderRadius: 12, padding: '14px 12px', flex: 1, minWidth: 0 }}>
            {/* Deck title */}
            <Typography.Text style={{ fontSize: 12, fontWeight: 500, color: '#000', display: 'block', marginBottom: 10, fontFamily: 'Roboto, sans-serif' }}>
                {title}
            </Typography.Text>

            {/* Driver indicator (lower deck) or invisible spacer (upper deck) to align dashed lines */}
            {showDriver ? (
                <Flex justify="center" align="center" gap={6} style={{ marginBottom: 8, height: 28 }}>
                    <img src={icDriver} alt="driver" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    <Typography.Text style={{ fontSize: 11, color: '#666' }}>Driver</Typography.Text>
                </Flex>
            ) : (
                <div style={{ height: 28, marginBottom: 8 }} />
            )}

            {/* Dashed separator */}
            <div style={{ borderBottom: '1.5px dashed #d9d9d9', marginBottom: 12 }} />

            {/* Seat grid */}
            <DeckGrid rows={rows} selectedSeats={selectedSeats} onSeatToggle={onSeatToggle} />
        </div>
    );
}

export default function SeatMap({ selectedSeats, onSeatToggle, lowerDeck, upperDeck }: Props) {
    const [priceFilter, setPriceFilter] = useState<PriceFilter>('all');

    const resolvedLower = lowerDeck ?? LOWER_DECK;
    const resolvedUpper = upperDeck ?? UPPER_DECK;

    const lowerPrice = deckMinPrice(resolvedLower);
    const upperPrice = deckMinPrice(resolvedUpper);

    const priceFilters: { label: string; subLabel: string; value: PriceFilter }[] = [
        { label: 'All', subLabel: '', value: 'all' },
        ...(resolvedLower.length > 0 && lowerPrice !== null
            ? [{ label: 'Lower', subLabel: `₹${lowerPrice}`, value: 'lower' as const }]
            : []),
        ...(resolvedUpper.length > 0 && upperPrice !== null
            ? [{ label: 'Upper', subLabel: `₹${upperPrice}`, value: 'upper' as const }]
            : []),
    ];

    const showLower = resolvedLower.length > 0;
    const showUpper = resolvedUpper.length > 0;
    const lowerDimmed = priceFilter === 'upper';
    const upperDimmed = priceFilter === 'lower';

    return (
        <Flex vertical gap={14} style={{ background: 'white', borderRadius: 12, padding: '16px 18px', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', height: '100%', overflowX: 'auto' }}>
            {/* Price filter */}
            <Flex align="center" justify="space-between">
                <Typography.Text style={{ fontSize: 12, color: '#555', flexShrink: 0 }}>Price:</Typography.Text>
                <Flex gap={8}>
                    {priceFilters.map(f => {
                        const active = priceFilter === f.value;
                        const greyed = priceFilter !== 'all' && !active && f.value !== 'all';
                        return (
                            <Flex
                                key={f.value}
                                vertical
                                align="center"
                                justify="center"
                                role="button"
                                tabIndex={0}
                                onClick={() => setPriceFilter(f.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setPriceFilter(f.value); }}
                                style={{
                                    padding: '4px 14px', borderRadius: 8, cursor: 'pointer',
                                    border: `1.5px solid ${active ? '#ff4f4f' : '#d9d9d9'}`,
                                    background: active ? 'rgba(255, 79, 79, 0.08)' : 'white',
                                    transition: 'all 0.12s',
                                    lineHeight: 1.3,
                                    height: 40,
                                    opacity: greyed ? 0.35 : 1,
                                }}
                            >
                                <Typography.Text style={{ fontSize: 13, fontWeight: 600, color: active ? '#ff4f4f' : '#333' }}>
                                    {f.label}
                                </Typography.Text>
                                {f.subLabel
                                    ? <Typography.Text style={{ fontSize: 10, color: active ? '#ff4f4f' : '#aaa' }}>{f.subLabel}</Typography.Text>
                                    : <span style={{ height: 14 }} />
                                }
                            </Flex>
                        );
                    })}
                </Flex>
            </Flex>

            {/* Legend */}
            <Flex gap={10} wrap="wrap">
                {LEGEND.map(({ label, key }) => {
                    const [, stripBg, border] = SEAT_STYLE[key];
                    const filled = key === 'selected';
                    return (
                        <Flex key={label} gap={5} align="center">
                            <div style={{
                                width: 14, height: 14, borderRadius: 3,
                                background: filled ? stripBg : 'white',
                                border: `2px solid ${border}`,
                            }} />
                            <Typography.Text style={{ fontSize: 11, color: '#666' }}>{label}</Typography.Text>
                        </Flex>
                    );
                })}
            </Flex>

            {/* Deck containers side by side */}
            <Flex gap={16} align="flex-start" style={{ overflowX: 'auto', paddingBottom: 4, flex: 1 }}>
                {showLower && (
                    <div style={{ opacity: lowerDimmed ? 0.3 : 1, pointerEvents: lowerDimmed ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                        <DeckContainer
                            title="Lower deck"
                            rows={resolvedLower}
                            selectedSeats={selectedSeats}
                            onSeatToggle={onSeatToggle}
                            showDriver
                        />
                    </div>
                )}
                {showUpper && (
                    <div style={{ opacity: upperDimmed ? 0.3 : 1, pointerEvents: upperDimmed ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
                        <DeckContainer
                            title="Upper deck"
                            rows={resolvedUpper}
                            selectedSeats={selectedSeats}
                            onSeatToggle={onSeatToggle}
                        />
                    </div>
                )}
            </Flex>
        </Flex>
    );
}
