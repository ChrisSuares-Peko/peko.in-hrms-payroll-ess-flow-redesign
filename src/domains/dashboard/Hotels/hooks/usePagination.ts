import { useEffect, useState } from 'react';

interface UsePaginationProps<T> {
    currentPage: number;
    data: T[];
}

const usePagination = <T>({
    currentPage,
    data = [],
}: UsePaginationProps<T>): {
    paginatedData: T[];
    itemsPerPage: number;
    pageLoading: boolean;
} => {
    const [paginatedData, setPaginatedData] = useState<T[]>([]);
    const [pageLoading, setPageLoading] = useState<boolean>(false);
    const [itemsPerPage] = useState<number>(10);

    useEffect(() => {
        setPageLoading(true);
        const timer = setTimeout(() => {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            setPaginatedData(data?.slice(startIndex, endIndex));
            setPageLoading(false);
        }, 150);

        return () => clearTimeout(timer);
    }, [currentPage, itemsPerPage, data]);

    return { paginatedData, itemsPerPage, pageLoading };
};

export default usePagination;
