/* eslint-disable no-plusplus */
import { useCallback } from 'react';

export default function useHotelFilters() {
    const filterHotels = useCallback((filteredHotel: any[], sortOption: string) => {
        if (filteredHotel.length > 0) {
            if (sortOption === 'priceLowToHigh') {
                return filteredHotel.slice().sort((a, b) => {
                    const priceA = a.Rooms[0].TotalFare;
                    const priceB = b.Rooms[0].TotalFare;
                    return priceA - priceB;
                });
            }
            if (sortOption === 'priceHighToLow') {
                return filteredHotel.slice().sort((a, b) => {
                    const priceA = a.Rooms[0].TotalFare;
                    const priceB = b.Rooms[0].TotalFare;
                    return priceB - priceA;
                });
            }
            if (sortOption === 'popular') {
                return filteredHotel.slice().sort((a, b) => {
                    const ratingA = Number(a.HotelRating) || 0;
                    const ratingB = Number(b.HotelRating) || 0;
                    const priceA = a.Rooms[0].TotalFare;
                    const priceB = b.Rooms[0].TotalFare;

                    if (ratingB !== ratingA) {
                        return ratingB - ratingA; // Higher rating first
                    }
                    return priceA - priceB; // If ratings are same, sort by price ascending
                });
            }
        }
        return filteredHotel;
    }, []);

    const filterByPriceRange = useCallback((data: any, range: [number, number]) => {
        const filteredData = data.filter((item: any) => {
            const totalPrice = item.Rooms[0].TotalFare;
            return totalPrice >= range[0] && totalPrice <= range[1];
        });

        return filteredData;
    }, []);

    const filterByHotelName = useCallback(
        (data: any, query: string) =>
            data.filter((item: any) => item.HotelName.toLowerCase().includes(query.toLowerCase())),
        []
    );

    const filterByRate = useCallback(
        (filteredByQuery: any[], selectedRateRanges: any) =>
            filteredByQuery.filter(hotel => {
                const totalPrice = hotel.Rooms[0].TotalFare;
                return (
                    selectedRateRanges.length === 0 ||
                    selectedRateRanges.some(
                        ([min, max]: [number, number]) => totalPrice >= min && totalPrice <= max
                    )
                );
            }),
        []
    );

    const filterByRatings = useCallback(
        (hotels: any[], selectedRating: number[]) =>
            hotels.filter(
                (hotel: any) =>
                    selectedRating.length === 0 ||
                    selectedRating.includes(Number(hotel.HotelRating))
            ),
        []
    );

    const calculateRatingCounts = useCallback(
        (hotels: any[]) =>
            [5, 4, 3, 2, 1, 0].reduce(
                (acc, rating) => {
                    acc[rating] = hotels.filter(
                        (hotel: any) => Number(hotel.HotelRating) === rating
                    ).length;
                    return acc;
                },
                {} as { [key: number]: number }
            ),
        []
    );

    const calculateRateCounts = useCallback((hotels: any[]) => {
        const rateCounts = {
            '0-2000': 0,
            '2000-4000': 0,
            '4000-7500': 0,
            '7500-11000': 0,
            '11000+': 0,
        };

        hotels.forEach((hotel: any) => {
            const totalPrice = hotel.Rooms.length > 0 ? hotel.Rooms[0].TotalFare : 0;

            if (totalPrice <= 2000) rateCounts['0-2000']++;
            else if (totalPrice > 2000 && totalPrice <= 4000) rateCounts['2000-4000']++;
            else if (totalPrice > 4000 && totalPrice <= 7500) rateCounts['4000-7500']++;
            else if (totalPrice > 7500 && totalPrice <= 11000) rateCounts['7500-11000']++;
            else rateCounts['11000+']++;
        });

        return rateCounts;
    }, []);

const AMENITY_MATCHERS: Record<string, RegExp[]> = {
  gym: [
    /\bgym\b/,
    /\bfitness center\b/,
    /\bfitness centre\b/,
    /\bfitness facilities\b/,
    /\bhealth club\b/,
    /\b24[- ]hour fitness\b/,
  ],

  spa: [
    /\bspa\b/,
    /\bfull[- ]service spa\b/,
  ],

  pool: [
    /\bswimming pool\b/,
    /\bnumber of .* pools?\b/,
    /\bpool\b/,
  ],

  free_wifi: [/\bwifi\b/],
  breakfast: [/\bbreakfast\b/],
  parking: [/\bparking\b/],
};


const filterByAmenities = (
  hotels: any[],
  selectedAmenities: string[]
) => {
  if (!selectedAmenities.length) return hotels;

  return hotels.filter(hotel => {
    const facilitiesRaw = hotel?.HotelFacilities;

    if (!Array.isArray(facilitiesRaw)) return false;

    const facilities = facilitiesRaw.map(f =>
      String(f).toLowerCase()
    );

    return selectedAmenities.every(amenity => {
      const matchers = AMENITY_MATCHERS[amenity];

      if (!matchers) return false; 

      const hasAmenity = matchers.some(regex =>
        facilities.some(f => regex.test(f))
      );


      return hasAmenity;
    });
  });
};






    // Return all the functions as part of the hook's output
    return {
        filterHotels,
        filterByPriceRange,
        filterByHotelName,
        filterByRate,
        filterByRatings,
        calculateRatingCounts,
        calculateRateCounts,
        filterByAmenities
    };
}
