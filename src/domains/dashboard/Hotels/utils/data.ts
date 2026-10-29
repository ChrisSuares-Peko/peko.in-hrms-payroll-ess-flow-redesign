import { TabsProps } from 'antd';

import booking1 from '@domains/dashboard/Hotels/Assets/booking.png';
import hotel1 from '@domains/dashboard/Hotels/Assets/hotel1.png';
import ac from '@domains/dashboard/Hotels/Assets/icons/ac.svg';
import bar from '@domains/dashboard/Hotels/Assets/icons/bar.svg';
import breakfast from '@domains/dashboard/Hotels/Assets/icons/breakfast.svg';
import droplets from '@domains/dashboard/Hotels/Assets/icons/droplets.svg';
import entertainment from '@domains/dashboard/Hotels/Assets/icons/entertainmnt.svg';
import fitness from '@domains/dashboard/Hotels/Assets/icons/fitness.svg';
import laundry from '@domains/dashboard/Hotels/Assets/icons/laundry.svg';
import ocean from '@domains/dashboard/Hotels/Assets/icons/ocean.svg';
import parking from '@domains/dashboard/Hotels/Assets/icons/parking.svg';
import pool from '@domains/dashboard/Hotels/Assets/icons/pool.svg';
import room from '@domains/dashboard/Hotels/Assets/icons/room.svg';
import safe from '@domains/dashboard/Hotels/Assets/icons/safe.svg';
import tv from '@domains/dashboard/Hotels/Assets/icons/tv.svg';
import wifi from '@domains/dashboard/Hotels/Assets/icons/wifi.svg';
import room1 from '@domains/dashboard/Hotels/Assets/room1.png';

export const hotels = [
    {
        image: hotel1,
        name: 'Grand Hyatt Kochi',
        facilities: '4-6 guests · Entire Home · 5 beds · 3 bath',
        reviews: 318,
        price: 21045,
    },
    {
        image: hotel1,
        name: 'Grand Hyatt Kochi',
        facilities: '4-6 guests · Entire Home · 5 beds · 3 bath',
        reviews: 318,
        price: 21045,
    },
    {
        image: hotel1,
        name: 'Grand Hyatt Kochi',
        facilities: '4-6 guests · Entire Home · 5 beds · 3 bath',
        reviews: 318,
        price: 21045,
    },
    {
        image: hotel1,
        name: 'Grand Hyatt Kochi',
        facilities: '4-6 guests · Entire Home · 5 beds · 3 bath',
        reviews: 318,
        price: 21045,
    },
];

export const facilities = [
    {
        facility: 'Free WiFi',
        icon: wifi,
    },
    {
        facility: 'Free parking',
        icon: parking,
    },
    {
        facility: 'Swimming pool',
        icon: pool,
    },
    {
        facility: 'Free breakfast',
        icon: breakfast,
    },
    {
        facility: 'Evening entertainment',
        icon: entertainment,
    },
    {
        facility: 'Fitness center with gym',
        icon: fitness,
    },
    {
        facility: 'Laundry service',
        icon: laundry,
    },
    {
        facility: 'Air conditioning',
        icon: ac,
    },
    {
        facility: 'Minibar',
        icon: bar,
    },
    {
        facility: 'Flat screen TV',
        icon: tv,
    },
    {
        facility: 'Safe',
        icon: safe,
    },
    {
        facility: 'Allergy-free room',
        icon: room,
    },
    {
        facility: 'Ocean view',
        icon: ocean,
    },
    {
        facility: 'Laundry service',
        icon: droplets,
    },
    {
        facility: 'Free (WiFi)',
        icon: wifi,
    },
    {
        facility: 'Free parking',
        icon: parking,
    },
    {
        facility: 'Swimming pool',
        icon: pool,
    },
    {
        facility: 'Free breakfast',
        icon: breakfast,
    },
    {
        facility: 'Evening entertainment',
        icon: entertainment,
    },
    {
        facility: 'Fitness center with gym',
        icon: fitness,
    },
    {
        facility: 'Laundry service',
        icon: laundry,
    },
    {
        facility: 'Air conditioning',
        icon: ac,
    },
    {
        facility: 'Minibar',
        icon: bar,
    },
    {
        facility: 'Flat screen TV',
        icon: tv,
    },
    {
        facility: 'Safe',
        icon: safe,
    },
    {
        facility: 'Allergy-free room',
        icon: room,
    },
    {
        facility: 'Ocean view',
        icon: ocean,
    },
    {
        facility: 'Laundry service',
        icon: droplets,
    },
];

export const rooms = [
    {
        name: 'Sea facing room',
        sqft: '336.0',
        image: room1,
    },
    {
        name: 'Sea facing room',
        sqft: '336.0',
        image: room1,
    },
];

export const bookings = [
    {
        name: 'Grand Hyatt Kochi',
        image: booking1,
        day: 1,
        adult: 2,
        room: 1,
        inDate: '4 October 2023',
        inTime: '12:25 PM',
        out: '4 October 2023',
        outTime: '12:25 PM',
        PRnumber: 'RPYTXP',
        confirmation: 202105375152,
    },
    {
        name: 'Grand Hyatt Kochi',
        image: hotel1,
        day: 1,
        adult: 2,
        room: 1,
        inDate: '4 October 2023',
        inTime: '12:25 PM',
        out: '4 October 2023',
        outTime: '12:25 PM',
        PRnumber: 'RPYTXP',
        confirmation: 202105375152,
    },
];

export const details = [
    {
        name: 'Grand Hyatt Kochi',
        about: 'This property is 12 minutes walk from the beach. This restored Victorian shipyard on the scenic Cochin Harbour offers air-conditioned rooms with beautiful sea views. A 1-minute walk from Fort Kochi-Vypeen Ferry Terminal, it has an outdoor pool and Ayurvedic massage treatments. The spacious rooms are all equipped with a TV, ironing facilities and hairdryer. Private bathrooms come with hot-water showers and toiletries. 24-hour room service is also available. Brunton Boatyard is a 10-minute walk from Santa Cruz Basilica. It is 15 km from Ernakulam Railway Station and 42 km from Cochin International Airport. Free parking is available. Guests can take part in walking tours organised by the hotel. Laundry services, luggage storage and a steam room are available. Airport shuttles can also be arranged at an extra charge. The History restaurant serves Cochin cuisi',
    },
];

export const reviews = [
    {
        review: 'Luxury with a buget',
        name: 'Manny',
        rate: 5,
        desc: 'Bedroom and bathroom was extremely clean and nice. Close enough to Downtown if you plan on taking taxi, which can cost approximately $1/min on the road. Their breakfast package is definitely worth it. Special thanks to hotel restaurant server Mehedi for his amazing hospitality.',
    },
    {
        review: 'Luxury with a buget',
        name: 'Manny',
        rate: 5,
        desc: 'Bedroom and bathroom was extremely clean and nice. Close enough to Downtown if you plan on taking taxi, which can cost approximately $1/min on the road. Their breakfast package is definitely worth it. Special thanks to hotel restaurant server Mehedi for his amazing hospitality.',
    },
];

export const price = {
    total: 4563,
    room: 3215,
    taxes: 876,
    mediCancel: 8765,
    ct: 678,
};

export const roomDetails = {
    name: 'Sea facing room',
    sqft: 336.0,
    guests: 2,
};

export const items: TabsProps['items'] = [
    {
        key: '1',
        label: 'Overview',
    },
    {
        key: '2',
        label: 'Facilities',
    },
    {
        key: '3',
        label: 'Rooms',
    },
    {
        key: '4',
        label: 'Reviews',
    },
];

export const roomTypes = [
    { key: 'adult', label: 'Adults', description: '18+ years' },
    { key: 'child', label: 'Children', description: '0-17 years' },
];

export const PaymentPayloadBody = {
    accessKey: 'hotels_api',
};

interface filterOption {
    value: string;
    label: string;
}
export const filterOptionsInListing: filterOption[] = [
    {
        value: 'high',
        label: 'Price High to Low',
    },
    {
        value: 'low',
        label: 'Price Low to High',
    },

    {
        value: 'popular',
        label: 'Popular',
    },
    {
        value: 'All',
        label: 'All',
    },
];

export const DISPLAY_FACILITIES = [
    { key: 'wifi', label: 'Free WiFi', match: /\bwifi\b/i, icon: wifi, iconSize: 15 },
    { key: 'breakfast', label: 'Free breakfast', match: /\bbreakfast\b/i, icon: breakfast, iconSize: 20 },
    { key: 'parking', label: 'Free parking', match: /\bparking\b/i, icon: parking, iconSize: 15 },
    { key: 'pool', label: 'Swimming pool', match: /\bpools?\b/i, icon: pool, iconSize: 15 },

     {
        key: 'gym',
        label: 'Gym / Fitness',
        match: /\b(gym|fitness)\b/i, // Gym or Fitness facilities
        icon: fitness,
        iconSize: 15,
    },

];



export const AMENITIES = [
  { key: 'free_wifi', label: 'Free Wi-Fi', match: ['wifi'] },
  { key: 'breakfast', label: 'Breakfast', match: ['breakfast'] },
  { key: 'parking', label: 'Parking', match: ['parking'] },

  // ➕ NEW
  { key: 'pool', label: 'Swimming Pool', match: ['pool', 'swimming'] },
  { key: 'gym', label: 'Gym / Fitness', match: ['gym', 'fitness'] },
//   { key: 'spa', label: 'Spa', match: ['spa'] },
];
