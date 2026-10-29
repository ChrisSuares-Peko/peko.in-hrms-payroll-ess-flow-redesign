import { useState } from 'react';

import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Flex, Input, Typography } from 'antd';

import TypographyText from '@components/atomic/typography/typographyText';
import useDebounce from '@src/hooks/useDebounce';

import CustomerSelectionCard from './CustomerSelectionCard';
import SelectionCardSkeleton from './SelectionCardSkeleton';
import useCustomers from '../../hooks/agreement/useCustomers';
import { Customer } from '../../types/agreement';
import { CustomerRow } from '../../types/customer';
import { toInitials } from '../../utils/helperFunctions';
import AddCustomerDrawer from '../customers/AddCustomerDrawer';

interface Props {
    selectedId: string;
    onSelectCustomer: (id: string, customer: Customer | undefined) => void;
}

const Step1SelectCustomer = ({ selectedId, onSelectCustomer }: Props) => {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const {
        customers: rawCustomers,
        isLoading: customersLoading,
        refetch,
    } = useCustomers(debouncedSearch, 100);

    const customers: Customer[] = rawCustomers.map((c: CustomerRow) => ({
        id: String(c.id),
        name: c.name,
        email: c.email,
        phone: c.phoneNumber,
        initials: toInitials(c.name),
        status: c.status,
        contactPerson: c.name,
        address: [c.primaryAddress, c.primaryCity, c.primaryState, c.primaryPincode]
            .filter(Boolean)
            .join('\n '),
    }));

    const selectedCustomer = customers.find(c => c.id === selectedId);

    const customerListContent =
        customers.length > 0 ? (
            <Flex vertical gap={6} className="overflow-y-auto pe-1" style={{ maxHeight: 320 }}>
                {customers.map(c => (
                    <Flex
                        key={c.id}
                        justify="space-between"
                        align="center"
                        className="p-3 rounded-xl cursor-pointer"
                        style={{
                            backgroundColor: c.id === selectedId ? '#FFF5F5' : '#FFFFFF',
                            border: c.id === selectedId ? '1px solid #FF4F4F' : '1px solid #E5E7EB',
                        }}
                        onClick={() => onSelectCustomer(c.id, c)}
                    >
                        <Flex align="center" gap={10}>
                            <Flex
                                justify="center"
                                align="center"
                                className="w-8 h-8 rounded-full bg-[#F4F4F5] shrink-0"
                            >
                                <Typography.Text className="text-xs font-medium">
                                    {c.initials}
                                </Typography.Text>
                            </Flex>
                            <Flex vertical gap={1}>
                                <Typography.Text className="text-sm font-semibold text-[#1E293B]">
                                    {c.name}
                                </Typography.Text>
                                <Typography.Text className="text-xs font-normal text-[#6B7280]">
                                    {c.email}
                                </Typography.Text>
                            </Flex>
                        </Flex>
                        <Typography.Text className="text-xs font-medium text-[#42526D]">
                            {c.phone}
                        </Typography.Text>
                    </Flex>
                ))}
            </Flex>
        ) : (
            <Flex
                vertical
                align="center"
                justify="center"
                gap={4}
                className="py-8 rounded-xl border border-dashed border-[#E4E4E7]"
            >
                <Typography.Text className="text-sm font-medium text-[#6B7280]">
                    No customers found
                </Typography.Text>
                <Typography.Text className="text-xs text-[#A1A1AA]">
                    Try a different search or add a new customer
                </Typography.Text>
            </Flex>
        );

    return (
        <>
            <Flex gap={16} className="p-4 md:p-6 flex-col lg:flex-row">
                <Flex vertical gap={10} className="w-full lg:flex-none lg:w-[360px]">
                    <Flex vertical gap={2}>
                        <TypographyText className="text-lg font-semibold">
                            Select Customer
                        </TypographyText>
                        <TypographyText className="text-sm text-gray-500">
                            Choose the customer for this agreement
                        </TypographyText>
                    </Flex>
                    <Input
                        prefix={<SearchOutlined className="text-[#CBD5E1]" />}
                        placeholder="Search customers"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="h-9 rounded-lg border-[#E4E4E7]"
                    />
                    {customersLoading ? <SelectionCardSkeleton /> : customerListContent}
                    <Button
                        icon={<PlusOutlined />}
                        className="h-9 rounded-lg border-[#FF4F4F] text-[#FF4F4F] text-sm font-medium w-full"
                        onClick={() => setIsDrawerOpen(true)}
                    >
                        Add new customer
                    </Button>
                </Flex>

                {selectedCustomer ? (
                    <CustomerSelectionCard customer={selectedCustomer} />
                ) : (
                    <Flex
                        flex={1}
                        vertical
                        align="center"
                        justify="center"
                        gap={6}
                        className="rounded-xl border border-dashed border-[#E4E4E7]"
                        style={{ minHeight: 240 }}
                    >
                        <Typography.Text className="text-sm font-medium text-[#6B7280]">
                            No customer selected
                        </Typography.Text>
                        <Typography.Text className="text-xs text-[#A1A1AA]">
                            Select a customer from the list to view details
                        </Typography.Text>
                    </Flex>
                )}
            </Flex>
            <AddCustomerDrawer
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onSuccess={() => {
                    setIsDrawerOpen(false);
                    refetch();
                }}
            />
        </>
    );
};

export default Step1SelectCustomer;
