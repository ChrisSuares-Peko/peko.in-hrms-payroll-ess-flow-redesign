import React, { useEffect, useState } from 'react';

import { CloseOutlined, DeleteOutlined, EditOutlined, MailOutlined, PhoneOutlined } from '@ant-design/icons';
import {
    Button,
    Card,
    Col,
    Drawer,
    Flex,
    Input,
    Row,
    Skeleton,
    Space,
    Tag,
    Typography,
} from 'antd';

import ConfirmationModal from '@src/components/molecular/modals/ConfirmationModal';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';


import AddBeneficiaryDrawer from './AddBeneficiaryDrawer';
import BeneficiaryIcon from '../assets/beneficiaryIcons/Icon.svg';
import useAddBeneficiaryApi from '../hooks/useAddBeneficiaryApi';
import useDeleteBeneficiaryApi from '../hooks/useDeleteBeneficiaryApi';
import useEditBeneficiaryApi from '../hooks/useEditBeneficiaryApi';
import useGetBeneficiariesApi from '../hooks/useGetBeneficiariesApi';
import { Beneficiary } from '../types';
import { paymentCategoryColorMap, paymentCategoryOptions } from '../utils/beneficiaryOptions';

const { Text, Title } = Typography;

const typeColorMap: Record<string, string> = {
    BUSINESS: 'blue',
    INDIVIDUAL: 'purple',
};


interface ManageBeneficiariesModalProps {
    visible: boolean;
    onClose: () => void;
    onUpdate?: () => void;
}

const ManageBeneficiariesModal: React.FC<ManageBeneficiariesModalProps> = ({
    visible,
    onClose,
    onUpdate,
}) => {
    const dispatch = useAppDispatch();
    const { getBeneficiaries, data: beneficiaries, isLoading } = useGetBeneficiariesApi();
    const { editBeneficiary, isLoading: editLoading } = useEditBeneficiaryApi();
    const { deleteBeneficiary, isLoading: deleteLoading } = useDeleteBeneficiaryApi();
    const { addBeneficiary, isLoading: addLoading } = useAddBeneficiaryApi();
    const [search, setSearch] = useState('');
    const [addDrawerVisible, setAddDrawerVisible] = useState(false);
    const [editDrawerVisible, setEditDrawerVisible] = useState(false);
    const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | undefined>(undefined);
    const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
    const [beneficiaryToDelete, setBeneficiaryToDelete] = useState<number | null>(null);

    useEffect(() => {
        if (visible) {
            getBeneficiaries();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visible]);

    const filtered = beneficiaries.filter(b =>
        b.fullName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <>
        <Drawer
            open={visible && !editDrawerVisible}
            onClose={onClose}
            placement="right"
            width={520}
            closable={false}
            title={
                <Flex align="center" justify="space-between">
                    <Space direction="vertical" size={2}>
                        <Title level={4} className="m-0">
                            Manage Beneficiaries
                        </Title>
                        <Text type="secondary" style={{ fontSize: 13, fontWeight: 'normal' }}>
                            View and manage all your payment beneficiaries
                        </Text>
                    </Space>
                    <Button type="text" icon={<CloseOutlined />} onClick={onClose} />
                </Flex>
            }
            footer={
                <Flex justify="space-between" align="center">
                    <Text type="secondary">
                        Showing {filtered.length} of {beneficiaries.length} beneficiaries
                    </Text>
                    <Button danger onClick={onClose}>
                        Close
                    </Button>
                </Flex>
            }
        >
            <Input
                placeholder="Search beneficiaries by name"
                value={search}
                onChange={e => setSearch(e.target.value.replace(/\p{Extended_Pictographic}/gu, ''))}
                style={{ marginBottom: 16, borderRadius: 8 }}
                allowClear
            />

            {isLoading ? (
                <Space direction="vertical" size={12} className="w-full">
                    {[1, 2, 3].map(i => (
                        <Card key={i} style={{ borderRadius: 12 }}>
                            <Skeleton active />
                        </Card>
                    ))}
                </Space>
            ) : (
                <Space direction="vertical" size={12} className="w-full">
                    {filtered.map((b) => (
                        <Card
                            key={b.id}
                            style={{ borderRadius: 12, borderColor: '#e5e7eb' }}
                            styles={{ body: { padding: '14px 16px' } }}
                        >
                            <Flex justify="space-between" align="flex-start">
                                <Flex gap={10} align="center">
                                    <Flex
                                        align="center"
                                        justify="center"
                                        style={{
                                            width: 40,
                                            height: 40,
                                            borderRadius: 8,
                                            background: '#F5F0FF',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <img src={BeneficiaryIcon} alt="beneficiary" width={20} height={20} />
                                    </Flex>
                                    <Space direction="vertical" size={4}>
                                        <Text strong style={{ fontSize: 14 }}>
                                            {b.fullName}
                                        </Text>
                                        <Flex gap={6} align="center" wrap="wrap" style={{ marginTop: 2 }}>
                                            <Tag color={typeColorMap[b.beneficiaryType ?? b.type] ?? 'default'} style={{ margin: 0, backgroundColor: '#f3f4f6', color: '#000', borderColor: '#e5e7eb' }}>
                                                {(b.beneficiaryType ?? b.type) === 'INDIVIDUAL' ? 'Individual' : 'Business'}
                                            </Tag>
                                            {b.paymentCategory && (
                                                <Tag color={paymentCategoryColorMap[b.paymentCategory] ?? 'default'} style={{ margin: 0, backgroundColor: '#f3f4f6', color: '#000', borderColor: '#e5e7eb' }}>
                                                    {paymentCategoryOptions.find(o => o.value === b.paymentCategory)?.label ?? b.paymentCategory}
                                                </Tag>
                                            )}
                                        </Flex>
                                        <Flex gap={20} wrap="wrap">
                                            {b.email && (
                                                <Flex gap={4} align="center">
                                                    <MailOutlined style={{ fontSize: 12, color: '#9ca3af' }} />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{b.email}</Text>
                                                </Flex>
                                            )}
                                            {b.mobile && (
                                                <Flex gap={4} align="center">
                                                    <PhoneOutlined rotate={90} style={{ fontSize: 12, color: '#9ca3af' }} />
                                                    <Text type="secondary" style={{ fontSize: 12 }}>{b.mobile}</Text>
                                                </Flex>
                                            )}
                                        </Flex>
                                    </Space>
                                </Flex>
                                <Flex gap={4}>
                                    <Button
                                        type="text"
                                        icon={<EditOutlined />}
                                        size="small"
                                        onClick={() => {
                                            setSelectedBeneficiary(b);
                                            setEditDrawerVisible(true);
                                        }}
                                    />
                                    <Button
                                        type="text"
                                        icon={<DeleteOutlined style={{ color: '#FF4D4F' }} />}
                                        size="small"
                                        onClick={() => {
                                            setBeneficiaryToDelete(b.id);
                                            setConfirmDeleteVisible(true);
                                        }}
                                    />
                                </Flex>
                            </Flex>

                            <Row gutter={[12, 8]} style={{ marginTop: 12, background: '#f9fafb', borderRadius: 8, padding: '10px 12px' }}>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        Account Number
                                    </Text>
                                    <br />
                                    <Text style={{ fontSize: 12 }}>{b.accountNumber}</Text>
                                </Col>
                                <Col span={12}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        IFSC Code
                                    </Text>
                                    <br />
                                    <Text style={{ fontSize: 12 }}>{b.ifscCode}</Text>
                                </Col>
                                {b.bankName && (
                                    <Col span={12}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            Bank Name
                                        </Text>
                                        <br />
                                        <Text style={{ fontSize: 12 }}>{b.bankName}</Text>
                                    </Col>
                                )}
                            </Row>

                            <Flex justify="space-between" style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0f0f0' }}>
                                <Space direction="vertical" size={2}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Total Paid</Text>
                                    <Text strong style={{ fontSize: 13 }}>
                                        {b.totalPaid != null
                                            ? `₹${b.totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : '—'}
                                    </Text>
                                </Space>
                                <Space direction="vertical" size={2} style={{ textAlign: 'right' }}>
                                    <Text type="secondary" style={{ fontSize: 11 }}>Last Payment</Text>
                                    <Text style={{ fontSize: 13 }}>
                                        {b.lastPaymentDate
                                            ? new Date(b.lastPaymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                                            : '—'}
                                    </Text>
                                </Space>
                            </Flex>
                        </Card>
                    ))}

                    {!isLoading && filtered.length === 0 && (
                        <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '24px 0' }}>
                            No beneficiaries found.
                        </Text>
                    )}
                </Space>
            )}
        </Drawer>

        <ConfirmationModal
            isOpen={confirmDeleteVisible}
            title="Are you sure you want to delete this beneficiary?"
            description="This action cannot be undone."
            handleCancel={() => { setConfirmDeleteVisible(false); setBeneficiaryToDelete(null); }}
            isLoading={deleteLoading}
            handleSubmit={async () => {
                if (!beneficiaryToDelete) return;
                const res = await deleteBeneficiary(beneficiaryToDelete);
                if (res) {
                    setConfirmDeleteVisible(false);
                    setBeneficiaryToDelete(null);
                    dispatch(showToast({ description: 'Beneficiary deleted successfully', variant: 'success' }));
                    getBeneficiaries();
                    onUpdate?.();
                }
            }}
        />

        <AddBeneficiaryDrawer
            visible={addDrawerVisible}
            onCancel={() => setAddDrawerVisible(false)}
            isLoading={addLoading}
            onAdd={async (payload) => {
                const res = await addBeneficiary(payload);
                if (res) {
                    setAddDrawerVisible(false);
                    dispatch(showToast({ description: 'Beneficiary added successfully', variant: 'success' }));
                    getBeneficiaries();
                    onUpdate?.();
                }
            }}
        />

        <AddBeneficiaryDrawer
            key={selectedBeneficiary?.id}
            visible={editDrawerVisible}
            onCancel={() => { setEditDrawerVisible(false); setSelectedBeneficiary(undefined); }}
            onBack={() => { setEditDrawerVisible(false); setSelectedBeneficiary(undefined); }}
            onAdd={() => {}}
            editData={selectedBeneficiary}
            isLoading={editLoading}
            onEdit={async (payload) => {
                if (!selectedBeneficiary) return;
                const res = await editBeneficiary(selectedBeneficiary.id, payload);
                if (res) {
                    setEditDrawerVisible(false);
                    setSelectedBeneficiary(undefined);
                    dispatch(showToast({ description: 'Beneficiary updated successfully', variant: 'success' }));
                    getBeneficiaries();
                }
            }}
        />
        </>
    );
};

export default ManageBeneficiariesModal;
