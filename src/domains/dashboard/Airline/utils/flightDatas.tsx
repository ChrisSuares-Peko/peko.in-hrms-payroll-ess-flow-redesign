import airindia from '@src/domains/dashboard/Airline/assets/images/airindia.png';
import emirates from '@src/domains/dashboard/Airline/assets/images/emirates.png';
import indigo from '@src/domains/dashboard/Airline/assets/images/indigo.png';
import qatarairways from '@src/domains/dashboard/Airline/assets/images/qatarairways.png';
import vistara from '@src/domains/dashboard/Airline/assets/images/vistara.png';

export const flights = [
    {
        logo: vistara,
        flightName: 'Vistara',
        flightClass: 'Economy Class',
        flightDuration: '3h 43 min',
        stopCount: '3',
        depart: {
            datetime: new Date(),
        },
        arrive: {
            datetime: new Date(),
        },
        id: '94935',
        price: '43938',
    },
    {
        logo: indigo,
        flightName: 'IndiGo',
        flightClass: 'Business Class',
        flightDuration: '2h 30 min',
        stopCount: '1',
        depart: {
            datetime: new Date(),
        },
        arrive: {
            datetime: new Date(),
        },
        id: '83927',
        price: '29850',
    },
    {
        logo: airindia,
        flightName: 'AirAsia',
        flightClass: 'Premium Economy',
        flightDuration: '5h 15 min',
        stopCount: '2',
        depart: {
            datetime: new Date(),
        },
        arrive: {
            datetime: new Date(),
        },
        id: '73214',
        price: '57200',
    },
    {
        logo: emirates,
        flightName: 'Emirates',
        flightClass: 'First Class',
        flightDuration: '7h 20 min',
        stopCount: '0',
        depart: {
            datetime: new Date(),
        },
        arrive: {
            datetime: new Date(),
        },
        id: '12456',
        price: '86000',
    },
    {
        logo: qatarairways,
        flightName: 'Qatar Airways',
        flightClass: 'Business Class',
        flightDuration: '6h 10 min',
        stopCount: '1',
        depart: {
            datetime: new Date(),
        },
        arrive: {
            datetime: new Date(),
        },
        id: '56789',
        price: '72500',
    },
    {
        logo: indigo,
        flightName: 'Singapore Airlines',
        flightClass: 'Premium Economy',
        flightDuration: '9h 30 min',
        stopCount: '2',
        depart: {
            datetime: new Date(),
        },
        arrive: {
            datetime: new Date(),
        },
        id: '98765',
        price: '95000',
    },
    {
        logo: airindia,
        flightName: 'Air India',
        flightClass: 'Economy Class',
        flightDuration: '4h 15 min',
        stopCount: '1',
        depart: {
            datetime: new Date(),
        },
        arrive: {
            datetime: new Date(),
        },
        id: '34567',
        price: '37500',
    },
];
type IUpcomingflight = { date: Date }[];

export const upcomingFlights: IUpcomingflight = [];

// eslint-disable-next-line no-plusplus
for (let i = 1; i <= 10; i++) {
    const nextDay = new Date();
    nextDay.setDate(nextDay.getDate() + i);
    upcomingFlights.push({ date: nextDay });
}

export const fareData = [
    {
        id: '1',
        fareType: 'Standard fare',
        price: '21,045',
        airport: 'Cochin International Airport, Cochin International Airport, Kochi, Terminal 1',
    },
    {
        id: '2',
        fareType: 'Premium fare',
        price: '35,678',
        airport: 'New York International Airport, New York, Terminal 2',
    },
    {
        id: '3',
        fareType: 'Business class',
        price: '54,321',
        airport: 'London Heathrow Airport, London, Terminal 3',
    },
];
