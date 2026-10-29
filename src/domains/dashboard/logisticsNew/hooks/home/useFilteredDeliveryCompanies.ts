import { useMemo, useState } from 'react';

import { DeliveryCompanyOption } from '../../types/index';

interface UseFilteredCompaniesProps {
    data: DeliveryCompanyOption[] | null;
}

export const useFilteredDeliveryCompanies = ({ data }: UseFilteredCompaniesProps) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('cheapest');

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
    };

    const filteredData = useMemo(() => {
        if (!data) return [];

        let result = [...data];

        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            result = result.filter(
                item =>
                    item.courierName?.toLowerCase()?.includes(s) ||
                    item.courierName?.toLowerCase()?.includes(s) ||
                    item.price?.toString()?.toLowerCase()?.includes(s) ||
                    item.serviceType?.toLowerCase()?.includes(s)
            );
        }

        switch (sortBy) {
            case 'cheapest':
                result.sort((a, b) => a.price - b.price);
                break;

            case 'expensive':
                result.sort((a, b) => b.price - a.price);
                break;

            case 'companyAZ':
                result.sort((a, b) => a.courierName.localeCompare(b.courierName));
                break;

            case 'companyZA':
                result.sort((a, b) => b.courierName.localeCompare(a.courierName));
                break;

            default:
                break;
        }

        return result;
    }, [data, searchTerm, sortBy]);

    return {
        searchTerm,
        sortBy,
        handleSearchChange,
        setSortBy,
        filteredData,
    };
};
