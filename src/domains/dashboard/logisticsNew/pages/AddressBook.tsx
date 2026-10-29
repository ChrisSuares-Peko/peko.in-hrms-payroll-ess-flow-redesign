import { useCallback, useEffect, useState } from 'react';

import { DeleteOutlined, EditOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Card, Col, Flex, Input, Popconfirm, Row, Tabs, Tag, Typography } from 'antd';

import { useAppDispatch, useAppSelector } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { deleteAddressApi, getSavedAddressApi } from '../api/address';
import AddAddressModal from '../components/home/AddAddressModal';
import { Address, AddressFieldValue } from '../types/address';

const { Text } = Typography;

const filterAddresses = (addresses: Address[], search: string) => {
    if (!search.trim()) return addresses;
    const q = search.toLowerCase();
    return addresses.filter(
        a =>
            a.name.toLowerCase().includes(q) ||
            (a.city ?? '').toLowerCase().includes(q) ||
            (a.country ?? '').toLowerCase().includes(q)
    );
};

const AddressCard = ({
    addr,
    isReceiver,
    onEdit,
    onDelete,
}: {
    addr: Address;
    isReceiver: boolean;
    onEdit: (isReceiver: boolean, addr: Address) => void;
    onDelete: (addressId: number) => void;
}) => (
    <Card
        className="rounded-2xl border border-slate-200 shadow-sm h-full"
        styles={{ body: { padding: '24px' } }}
    >
        <Flex justify="space-between" align="flex-start" className="mb-3">
            <Flex align="center" gap={8} className="min-w-0 flex-1 mr-2">
                <Text className="font-semibold text-base text-[#0e0e0e] truncate">{addr.name}</Text>
                {addr.default === 1 && (
                    <Tag color="green" >
                        DEFAULT
                    </Tag>
                )}
            </Flex>
            <Flex gap={2} className="flex-shrink-0">
                <Button
                    type="text"
                    size="small"
                    icon={<EditOutlined />}
                    className="text-gray-400 hover:text-blue-500"
                    onClick={() => onEdit(isReceiver, addr)}
                />
                <Popconfirm
                    title="Delete this address?"
                    description="This action cannot be undone."
                    onConfirm={() => addr.id && onDelete(addr.id)}
                    okButtonProps={{ danger: true }}
                    okText="Delete"
                    cancelText="Cancel"
                >
                    <Button
                        type="text"
                        size="small"
                        icon={<DeleteOutlined />}
                        className="text-gray-400 hover:text-red-500"
                    />
                </Popconfirm>
            </Flex>
        </Flex>

        <Text className="block text-xs text-gray-600 mb-0.5">{addr.addressLine1}</Text>
        {addr.addressLine2 && (
            <Text className="block text-xs text-gray-500 mb-0.5">{addr.addressLine2}</Text>
        )}
        <Text className="block text-xs text-gray-500 mb-0.5">
            {[addr.city, addr.state, addr.country].filter(Boolean).join(', ')}
        </Text>
        {addr.zipCode && (
            <Text className="block text-xs text-gray-400 mb-1">{addr.zipCode}</Text>
        )}
        <Text className="block text-xs text-gray-600">{addr.phoneNumber}</Text>
    </Card>
);

const AddressList = ({
    addresses,
    isReceiver,
    search,
    onEdit,
    onDelete,
}: {
    addresses: Address[];
    isReceiver: boolean;
    search: string;
    onEdit: (isReceiver: boolean, addr: Address) => void;
    onDelete: (addressId: number) => void;
}) => {
    const filtered = filterAddresses(addresses, search);
    if (!filtered.length) {
        return (
            <div className="text-center py-16">
                <Text className="text-gray-400">
                    {search ? 'No addresses match your search' : 'No addresses saved yet'}
                </Text>
            </div>
        );
    }
    return (
        <Row gutter={[16, 16]}>
            {filtered.map((addr, i) => (
                <Col key={addr.id ?? i} xs={24} sm={12} lg={8}>
                    <AddressCard addr={addr} isReceiver={isReceiver} onEdit={onEdit} onDelete={onDelete} />
                </Col>
            ))}
        </Row>
    );
};

const AddressBook = () => {
    const { id, role } = useAppSelector(state => state.reducer.auth);
    const dispatch = useAppDispatch();

    const [senderAddresses, setSenderAddresses] = useState<Address[]>([]);
    const [receiverAddresses, setReceiverAddresses] = useState<Address[]>([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('sender');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalIsReceiver, setModalIsReceiver] = useState(false);
    const [editAddressData, setEditAddressData] = useState<AddressFieldValue | undefined>(undefined);

    const fetchAddresses = useCallback(async () => {
        const [senderRes, receiverRes] = await Promise.all([
            getSavedAddressApi({ userId: id, userType: role, isReceiver: false }),
            getSavedAddressApi({ userId: id, userType: role, isReceiver: true }),
        ]);
        if (senderRes) setSenderAddresses(senderRes.addresses);
        if (receiverRes) setReceiverAddresses(receiverRes.addresses);
    }, [id, role]);

    useEffect(() => {
        fetchAddresses();
    }, [fetchAddresses]);

    const handleDelete = async (addressId: number) => {
        const ok = await deleteAddressApi({ userId: id, userType: role, addressId });
        if (ok) {
            dispatch(showToast({ description: 'Address deleted successfully', variant: 'success' }));
            fetchAddresses();
        } else {
            dispatch(showToast({ description: 'Failed to delete address', variant: 'error' }));
        }
    };

    const openAddModal = (isReceiver: boolean) => {
        setEditAddressData(undefined);
        setModalIsReceiver(isReceiver);
        setModalOpen(true);
    };

    const openEditModal = (isReceiver: boolean, addr: Address) => {
        setEditAddressData({
            id: addr.id,
            name: addr.name,
            phoneNumber: addr.phoneNumber,
            email: addr.email ?? '',
            zipCode: addr.zipCode ?? '',
            address1: addr.addressLine1,
            address2: addr.addressLine2 ?? '',
            state: addr.state ?? '',
            city: addr.city ?? '',
            country: addr.country ?? 'India',
            countryCode: addr.countryCode ?? 'IN',
            phoneCode: addr.phoneCode ?? '+91',
        });
        setModalIsReceiver(isReceiver);
        setModalOpen(true);
    };

    // const isInternationalReceiver = modalIsReceiver && shipmentType === 'international';

    return (
        <div className="p-6">
            <Flex justify="space-between" align="center" className="mb-6" wrap="wrap" gap={12}>
                <Flex vertical gap={4}>
                    <Text className="text-2xl font-medium text-black">Address Book</Text>
                    <Text className="text-base text-[#62748e]">
                        Manage your saved addresses for logistics shipments
                    </Text>
                </Flex>
                <Flex gap={10} align="center" wrap="wrap">
                    <Input
                        placeholder="Search addresses"
                        suffix={<SearchOutlined className="text-gray-400" />}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        allowClear
                        style={{ width: 320 }}
                        className="rounded-lg"
                    />
                    <Button
                        danger
                        type="primary"
                        onClick={() => openAddModal(activeTab === 'receiver')}
                    >
                        Add New Address
                    </Button>
                </Flex>
            </Flex>

            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    {
                        key: 'sender',
                        label: `Sender (${senderAddresses.length})`,
                        children: (
                            <AddressList
                                addresses={senderAddresses}
                                isReceiver={false}
                                search={search}
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                            />
                        ),
                    },
                    {
                        key: 'receiver',
                        label: `Receiver (${receiverAddresses.length})`,
                        children: (
                            <AddressList
                                addresses={receiverAddresses}
                                isReceiver
                                search={search}
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                            />
                        ),
                    },
                ]}
            />

            <AddAddressModal
                open={modalOpen}
                isReceiver={modalIsReceiver}
                editAddressData={editAddressData}
                onClose={() => setModalOpen(false)}
                onSaved={fetchAddresses}
            />
        </div>
    );
};

export default AddressBook;
