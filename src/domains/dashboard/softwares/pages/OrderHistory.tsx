import { Flex } from 'antd';

import '../assets/styles/styles.css';
import { Header, OrderTable } from '../components/orderHistory';
import useOrderHistory from '../hooks/order/useOrderHistory';

export default function PurchaseTable() {
    const {
        isLoading,
        orderDetails,
        handleFilterChange,
        handleSearchChange,
        handlePagination,
        filter,
        searchInput,
        total,
    } = useOrderHistory();

    return (
        <Flex vertical gap={20}>
            <Header
                handleFilterChange={handleFilterChange}
                handleSearchChange={handleSearchChange}
                filter={filter}
                searchInput={searchInput}
            />
            <OrderTable
                isLoading={isLoading}
                orderDetails={orderDetails}
                filter={filter}
                handlePagination={handlePagination}
                total={total}
            />
        </Flex>
    );
}
