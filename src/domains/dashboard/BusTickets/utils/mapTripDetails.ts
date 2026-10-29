import { StopPoint } from '../types/buslist';
import type { TripBoardingPoint, TripDetails, TripSeat } from '../types/buslist';

export type SeatStatus = 'available' | 'sold' | 'female' | 'male';

export interface Seat {
    id: string;
    number: number | string;
    status: SeatStatus;
    price: number;
    width: number;
    length: number;
}

export interface DeckRow {
    row: number;
    cols: Record<number, Seat>;  // key = column index from API
}

function minutesToAmPm(mins: string): string {
    const m = parseInt(mins, 10);
    if (Number.isNaN(m)) return '';
    const totalMins = m % (24 * 60);
    const h = Math.floor(totalMins / 60);
    const min = totalMins % 60;
    const ampm = h >= 12 ? 'PM' : 'AM';
    let h12: number;
    if (h > 12) h12 = h - 12;
    else if (h === 0) h12 = 12;
    else h12 = h;
    return `${String(h12).padStart(2, '0')}:${String(min).padStart(2, '0')} ${ampm}`;
}

function getSeatStatus(seat: TripSeat): SeatStatus {
    if (seat.available === 'false' || seat.reservedForSocialDistancing === 'true') return 'sold';
    if (seat.ladiesSeat === 'true') return 'female';
    if (seat.malesSeat === 'true') return 'male';
    return 'available';
}

function mapApiSeat(apiSeat: TripSeat): Seat {
    return {
        id: `seat-${apiSeat.name}-${apiSeat.zIndex}`,
        number: apiSeat.name,
        status: getSeatStatus(apiSeat),
        price: parseFloat(apiSeat.fare),
        width: Math.max(1, parseInt(apiSeat.width, 10) || 1),
        length: Math.max(1, parseInt(apiSeat.length, 10) || 1),
    };
}

function buildDeckRows(seats: TripSeat[]): DeckRow[] {
    const uniqueCols = new Set(seats.map(s => s.column)).size;
    const uniqueRows = new Set(seats.map(s => s.row)).size;

    // When column has far more unique values than row, `column` is the front-to-back axis
    // (visual row) and `row` is the across-width axis (visual column). Swap axes in that case.
    const swapAxes = uniqueCols > uniqueRows * 1.5;

    const rowMap = new Map<number, Record<number, Seat>>();
    seats.forEach(apiSeat => {
        const rowKey = parseInt(swapAxes ? apiSeat.column : apiSeat.row, 10);
        const colKey = parseInt(swapAxes ? apiSeat.row : apiSeat.column, 10);
        if (!rowMap.has(rowKey)) rowMap.set(rowKey, {});
        rowMap.get(rowKey)![colKey] = mapApiSeat(apiSeat);
    });

    return Array.from(rowMap.entries())
        .sort(([a], [b]) => a - b)
        .map(([row, cols]) => ({ row, cols }));
}

export function mapTripDetailsToDecks(data: TripDetails): { lower: DeckRow[]; upper: DeckRow[] } {
    const lowerSeats = data.seats.filter(s => s.zIndex === '0');
    const upperSeats = data.seats.filter(s => s.zIndex === '1');
    return {
        lower: buildDeckRows(lowerSeats),
        upper: buildDeckRows(upperSeats),
    };
}

function mapBoardingPoint(bp: TripBoardingPoint, _index: number, _prefix: string, date: string): StopPoint {
    return {
        id: String(bp.bpId),
        name: bp.bpName,
        time: minutesToAmPm(bp.time),
        date,
        address: bp.address,
    };
}

export function mapTripDetailsToStops(
    data: TripDetails,
    date: string,
): { boardingPoints: StopPoint[]; dropPoints: StopPoint[] } {
    const boardingArr = Array.isArray(data.boardingTimes)
        ? data.boardingTimes
        : [data.boardingTimes];

    const droppingArr = Array.isArray(data.droppingTimes)
        ? data.droppingTimes
        : [data.droppingTimes];

    return {
        boardingPoints: boardingArr.map((bp, i) => mapBoardingPoint(bp, i, 'bp', date)),
        dropPoints: droppingArr.map((dp, i) => mapBoardingPoint(dp, i, 'dp', date)),
    };
}
