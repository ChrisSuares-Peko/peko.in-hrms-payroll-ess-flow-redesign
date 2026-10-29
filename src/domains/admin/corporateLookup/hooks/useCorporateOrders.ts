import { useCallback, useEffect, useState } from 'react';

import dayjs from 'dayjs';

import { getAllData } from '@src/domains/admin/reports/api/order';
import { TransactionInfo } from '@src/domains/admin/reports/types/orders';
import { useAppSelector } from '@src/hooks/store';

const useCorporateOrders = (corporateId: string | number | undefined) => {
    const { role, id } = useAppSelector(state => state.reducer.auth);
    const [isLoading, setIsLoading] = useState(false);
    const [tableData, setTableData] = useState<TransactionInfo[]>([]);
    const [count, setCount] = useState(0);
    const [page, setPage] = useState(1);
    const [sort, setSort] = useState('DESC');
    const [sortField, setSortField] = useState('');
    const [searchText, setSearchText] = useState('');

    useEffect(() => {
        setPage(1);
    }, [corporateId]);

    const fetchOrders = useCallback(async () => {
        if (!corporateId) {
            setTableData([]);
            setCount(0);
            return;
        }
        setIsLoading(true);
        const data = await getAllData({
            userId: id,
            userType: role,
            searchText,
            sort,
            sortField,
            page,
            itemsPerPage: 10,
            from: '2020-01-01',
            to: dayjs().format('YYYY-MM-DD'),
            id: corporateId,
        });
        if (data) {
            setTableData(data.result);
            setCount(data.totalData);
        } else {
            setTableData([]);
            setCount(0);
        }
        setIsLoading(false);
    }, [id, role, corporateId, page, sort, sortField, searchText]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handlePageChange = (newPage: number) => setPage(newPage);

    const handleTableChange = (_: any, __: any, sorter: any) => {
        setSort(sorter.order === 'ascend' ? 'ASC' : 'DESC');
        setSortField(sorter.field ?? '');
        setPage(1);
    };

    const handleSearchChange = (val: string) => {
        setSearchText(val);
        setPage(1);
    };

    return {
        isLoading,
        tableData,
        count,
        page,
        searchText,
        handlePageChange,
        handleTableChange,
        handleSearchChange,
    };
};

export default useCorporateOrders;
