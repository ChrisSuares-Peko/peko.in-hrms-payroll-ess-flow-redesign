interface Airport {
    id: number;
    airportCode: string;
    airportName: string;
    cityCode: string;
    cityName: string;
    countryCode: string;
    countryName: string;
}

export interface AirportSearchResult {
    airports: Airport[];
}

export type ISearchData = {
    value: string;
    location?: string;
    label: string;
    countryCode: string;
};
