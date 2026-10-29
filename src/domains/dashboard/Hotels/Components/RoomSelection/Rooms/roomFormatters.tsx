import { CarOutlined, CoffeeOutlined } from '@ant-design/icons';
import { LuUtensilsCrossed } from 'react-icons/lu';

import { formatNumberWithLocalString } from '@utils/priceFormat';

export interface CancelPolicy {
    FromDate: string;
    ChargeType: string;
    CancellationCharge: number;
}

export const formatRoomName = (name: string) =>
    (name ?? '').replace(/,([^ ])/g, ', $1').replace(/([a-z])([A-Z])/g, '$1 $2');

const MEAL_TYPE_LABELS: Record<string, string> = {
    breakfast: 'Breakfast',
    roomonly: 'Room Only',
    halfboard: 'Half Board',
    fullboard: 'Full Board',
    allinclusive: 'All Inclusive',
};

export const formatMealType = (mealType?: string) => {
    const key = (mealType ?? '').replace(/_/g, '').toLowerCase();
    return (
        MEAL_TYPE_LABELS[key] ??
        (mealType ?? '')
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .trim()
    );
};

export const formatPolicyDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const [day, month, year] = dateStr.split(' ')[0].split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Policy dates come as "DD-MM-YYYY HH:mm:ss"
const parsePolicyDate = (dateStr: string) => {
    const [day, month, year] = dateStr.split(' ')[0].split('-').map(Number);
    return new Date(year, month - 1, day);
};

const toPolicyDateString = (date: Date) =>
    [
        String(date.getDate()).padStart(2, '0'),
        String(date.getMonth() + 1).padStart(2, '0'),
        date.getFullYear(),
    ].join('-');

/**
 * Last day of free cancellation, as "DD-MM-YYYY". A free (0 charge) policy applies from its
 * FromDate until the next charged policy starts, so the deadline is the day before that.
 * Returns null when there is no free window.
 */
export const getFreeCancellationDeadline = (policies?: CancelPolicy[]): string | null => {
    const sorted = (policies ?? [])
        .filter(p => p?.FromDate)
        .sort(
            (a, b) => parsePolicyDate(a.FromDate).getTime() - parsePolicyDate(b.FromDate).getTime()
        );

    const firstFreeIndex = sorted.findIndex(p => Number(p.CancellationCharge) === 0);
    if (firstFreeIndex === -1) return null;

    const nextCharged = sorted
        .slice(firstFreeIndex + 1)
        .find(p => Number(p.CancellationCharge) > 0);
    if (!nextCharged) return sorted[sorted.length - 1].FromDate.split(' ')[0];

    const deadline = parsePolicyDate(nextCharged.FromDate);
    deadline.setDate(deadline.getDate() - 1);
    return toPolicyDateString(deadline);
};

export const inclusionIcon = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes('breakfast')) return <CoffeeOutlined />;
    if (lower.includes('parking') || lower.includes('transfer')) return <CarOutlined />;
    return <LuUtensilsCrossed />;
};

export const chargeLabel = (policy: CancelPolicy) =>
    policy.ChargeType === 'Percentage'
        ? `${policy.CancellationCharge}% of booking amount`
        : `₹${formatNumberWithLocalString(policy.CancellationCharge)}`;

export const promotionLabel = (roomPromotion?: string[]): string | undefined => {
    const raw = roomPromotion?.[0];
    if (!raw) return undefined;
    return raw.includes(':') ? `Save ${raw.split(':')[1]}` : raw;
};

export const priceLabel = (room: any) => {
    const numRooms = room.Name?.length ?? 1;
    const numNights = room.DayRates?.[0]?.length ?? 1;
    if (numRooms > 1 && numNights > 1) return `total for ${numRooms} rooms, ${numNights} nights`;
    if (numRooms > 1) return `total for ${numRooms} rooms`;
    if (numNights > 1) return `total for ${numNights} nights`;
    return 'per night';
};

export const buildAmenityItems = (room: any) => {
    const inclusions: string[] = (room.Inclusion ?? '')
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean);

    return [
        ...inclusions.map(text => ({ text, icon: inclusionIcon(text) })),
        ...(room.MealType
            ? [
                  {
                      text: `Meal Plan: ${formatMealType(room.MealType)}`,
                      icon: <LuUtensilsCrossed />,
                  },
              ]
            : []),
    ];
};
