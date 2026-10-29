import { StopPoint } from '../types/buslist';

export const BOARDING_POINTS: StopPoint[] = [
    { id: 'bp1', name: 'Nayandahalli', time: '05:00 AM', date: '04 Jun', address: 'In Front Of Nayandahalli Metro Station, Opposite To Global Mall' },
    { id: 'bp2', name: 'Majestic Bus Station', time: '05:00 AM', date: '04 Jun', address: 'In Front Of Majestic Bus Station, Opposite KR Market' },
    { id: 'bp3', name: 'Anand Rao Circle', time: '05:15 AM', date: '04 Jun', address: 'In Front Of Anand Rao Circle, Near Gandhi Nagar' },
    { id: 'bp4', name: 'Corporation Circle', time: '05:30 AM', date: '04 Jun', address: 'Near Corporation Circle, MG Road' },
    { id: 'bp5', name: 'Shivajinagar', time: '05:45 AM', date: '04 Jun', address: 'Shivajinagar Bus Stand, Near Military Dairy Farm Road' },
    { id: 'bp6', name: 'Silk Board', time: '06:00 AM', date: '04 Jun', address: 'Opposite Forum Mall, Silk Board Junction' },
    { id: 'bp7', name: 'Electronic City', time: '06:30 AM', date: '04 Jun', address: 'Opposite Infosys Gate 1, Electronic City Phase 1' },
];

export const DROP_POINTS: StopPoint[] = [
    { id: 'dp1', name: 'Koyambedu', time: '03:00 AM', date: '05 Jun', address: 'Koyambedu Bus Terminus, Chennai – 600107' },
    { id: 'dp2', name: 'Chennai Central', time: '03:30 AM', date: '05 Jun', address: 'Chennai Central Railway Station, Park Town' },
    { id: 'dp3', name: 'Poonamallee Bypass', time: '04:00 AM', date: '05 Jun', address: 'Poonamallee High Road, Near Apollo Hospital' },
    { id: 'dp4', name: 'Tambaram', time: '04:30 AM', date: '05 Jun', address: 'Tambaram Bus Stand, GST Road' },
    { id: 'dp5', name: 'Guindy', time: '05:00 AM', date: '05 Jun', address: 'Guindy Bus Stand, Anna Salai' },
];

export const AMENITIES = ['WiFi on Board', 'Charging Point', 'Blankets', 'Reading Light', 'Emergency Contact', 'CCTV'];

export const RATING_BREAKDOWN = [
    { star: 5, pct: 84 },
    { star: 4, pct: 84 },
    { star: 3, pct: 84 },
    { star: 2, pct: 84 },
    { star: 1, pct: 84 },
];

export const LOVED_TAGS = ['Punctuality', 'Staff behavior', 'Cleanliness', 'Driving'];

export const TRAVEL_POLICIES = [
    { title: 'Child Passenger Policy', body: 'Children above the age of 3 will need a ticket' },
    { title: 'Luggage Policy', body: '1 piece of luggage will be accepted free of charge per passenger. Excess items will be chargeable' },
    { title: 'Excess Baggage', body: 'Excess baggage over 10 kgs per passenger will be chargeable' },
    { title: 'Pets Policy', body: 'Pets are not allowed' },
    { title: 'Liquor Policy', body: 'Carrying or consuming liquor inside the bus is prohibited. Bus operator reserves the right to deboard drunk passengers' },
    { title: 'Pick Up Time Policy', body: 'Bus operator is not obligated to wait beyond the scheduled departure time. No refund will be entertained for late arriving passengers' },
];

export const CANCELLATION_ROWS = [
    { time: 'Before 4th Jun 10:30 AM', percent: '15%', amount: '₹184.50' },
    { time: 'After 4th Jun 10:30 AM & Before 4th Jun 02:30 PM', percent: '30%', amount: '₹369.00' },
    { time: 'After 4th Jun 02:30 PM & Before 4th Jun 06:30 PM', percent: '60%', amount: '₹738.00' },
    { time: 'After 4th Jun 06:30 PM & Before 4th Jun 10:30 PM', percent: '95%', amount: '₹1,168.50' },
];

export const TABS = [
    { key: 'boarding',  label: 'Boarding point' },
    { key: 'drop',      label: 'Drop point' },
    { key: 'amenities', label: 'Amenities' },
    { key: 'rating',    label: 'Rating' },
    { key: 'policy',    label: 'Policy' },
    { key: 'images',    label: 'Bus Photos' },
] as const;

export type TabKey = (typeof TABS)[number]['key'];
