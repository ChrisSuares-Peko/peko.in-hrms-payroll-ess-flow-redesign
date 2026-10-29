import React, { useRef, useState } from 'react';

import { CheckOutlined, CloseOutlined, MailOutlined, SearchOutlined, UserAddOutlined } from '@ant-design/icons';
import { Button, Card, Divider, Flex, Grid, Image, Input, Typography } from 'antd';
import { useFormikContext } from 'formik';

import { useAppDispatch } from '@src/hooks/store';

import newRFQsIcon from '../../../assets/icons/newRFQsIcon.svg';
import { setRFQDraft } from '../../../slices/rfqDraftSlice';
import { Vendor } from '../../../types';
import AddVendorDrawer from '../../Vendor/AddVendorDrawer';

const { Text } = Typography;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
    vendorOptions: Vendor[];
    selectedVendors: Vendor[];
    setSelectedVendors: React.Dispatch<React.SetStateAction<Vendor[]>>;
    refetchVendors?: () => void;
};

const SelectVendors: React.FC<Props> = ({ vendorOptions, selectedVendors, setSelectedVendors, refetchVendors }) => {
    const dispatch = useAppDispatch();
    const { md } = Grid.useBreakpoint();
    const isMobile = !md;
    const [addVendorOpen, setAddVendorOpen] = useState(false);
    const { setFieldValue, setFieldTouched, errors, touched, values } = useFormikContext<any>();
    const [search, setSearch] = useState('');
    const [open, setOpen] = useState(false);
    const suppressBlur = useRef(false);
    const inputRef = useRef<any>(null);

    const invitedEmails: string[] = values.invitedEmails ?? [];

    const isSelected = (id: number) => selectedVendors.some(v => v.id === id);

    const toggleVendor = (vendor: Vendor) => {
        let next: Vendor[];
        if (isSelected(vendor.id)) {
            next = selectedVendors.filter(v => v.id !== vendor.id);
        } else {
            next = [...selectedVendors, vendor];
        }
        setSelectedVendors(next);
        setFieldValue('invitedVendors', next.map(v => v.id));
        setFieldTouched('invitedVendors', true, false);
        // close dropdown and clear search after each selection
        setOpen(false);
        setSearch('');
    };

    const addEmail = (email: string) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed || invitedEmails.includes(trimmed)) return;
        const next = [...invitedEmails, trimmed];
        setFieldValue('invitedEmails', next);
        setFieldTouched('invitedEmails', true, false);
        setSearch('');
    };

    const removeEmail = (email: string) => {
        const next = invitedEmails.filter(e => e !== email);
        setFieldValue('invitedEmails', next);
    };

    const filtered = vendorOptions.filter(v => {
        const q = search.toLowerCase();
        const emailAlreadyInvited = v.email && invitedEmails.includes(v.email.toLowerCase());
        if (emailAlreadyInvited) return false;
        return v.businessName.toLowerCase().includes(q) || v.email?.toLowerCase().includes(q);
    });

    const showInviteRow =
        search.trim() !== '' &&
        EMAIL_RE.test(search.trim()) &&
        !vendorOptions.some(v => v.email?.toLowerCase() === search.trim().toLowerCase()) &&
        !invitedEmails.includes(search.trim().toLowerCase());

    const showError =
        touched.invitedVendors &&
        selectedVendors.length === 0 &&
        invitedEmails.length === 0 &&
        (errors.invitedVendors as string);

    const totalSelected = selectedVendors.length + invitedEmails.length;

    return (
        <>
        <Card bordered={false} className="rounded-2xl mb-4" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: 24 } }}>
            {/* Header */}
            <Flex gap={10} align="center" className="mb-4">
                <Flex
                    align="center"
                    justify="center"
                    className="shrink-0 text-sm rounded-lg"
                    style={{ width: 28, height: 28, background: '#fff1f0' }}
                >
                    <Image src={newRFQsIcon} alt="New RFQ" width={16} height={16} preview={false} />
                </Flex>
                <Flex vertical>
                    <Text strong className="text-sm">Select Vendors</Text>
                    <Text className="text-xs text-[rgba(0,0,0,0.45)]">Choose which vendors will receive this request</Text>
                </Flex>
            </Flex>
            <Divider style={{ margin: '12px -24px', width: 'calc(100% + 48px)' }} />

            <Card bordered={false} className="rounded-lg mb-0" style={{ boxShadow: '0 2px 8px 0 rgba(0,0,0,0.08)' }} styles={{ body: { padding: '12px 16px' } }}>
                <Flex vertical={isMobile} justify={isMobile ? undefined : 'space-between'} align={isMobile ? 'flex-start' : 'center'} gap={8} className="mb-3">
                    <Flex vertical style={{ flex: 1, minWidth: 0 }}>
                        <Text strong className="text-sm">
                            Invited supplier list
                            {totalSelected > 0 && (
                                <Text style={{ fontSize: 12, color: '#ff4f4f', marginLeft: 6 }}>
                                    ({totalSelected} selected)
                                </Text>
                            )}
                        </Text>
                        <Text className="text-xs text-gray-400">
                            Add a vendor without losing your RFQ draft, then return here to include them
                        </Text>
                    </Flex>
                    <Button
                        icon={
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 24,
                                height: 24,
                                background: '#fff8f8',
                                borderRadius: 8,
                                flexShrink: 0,
                            }}>
                                <UserAddOutlined style={{ fontSize: 11, color: '#ff4f4f' }} />
                            </span>
                        }
                        onClick={() => {
                            dispatch(setRFQDraft(values as any));
                            setAddVendorOpen(true);
                        }}
                        style={{
                            height: 38,
                            borderColor: '#ff4f4f',
                            color: '#ff4f4f',
                            background: '#fff',
                            borderRadius: 10,
                            fontSize: 12,
                            fontWeight: 500,
                            flexShrink: 0,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '0 10px',
                        }}
                    >
                        Add Vendor
                    </Button>
                </Flex>

                {/* Vendor list — opens on search focus, closes on blur */}
                <div style={{ position: 'relative' }}>
                    <div style={{
                        border: showError ? '1px solid #ff4f4f' : '1px solid #f0f0f0',
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: '#fff',
                    }}>
                        {/* Search input always visible */}
                        <Input
                            ref={inputRef}
                            prefix={<SearchOutlined style={{ color: '#bfbfbf', fontSize: 13 }} />}
                            placeholder="Search vendors or type an email to invite"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            onFocus={() => setOpen(true)}
                            onBlur={() => {
                                if (suppressBlur.current) {
                                    suppressBlur.current = false;
                                    inputRef.current?.focus();
                                    return;
                                }
                                setOpen(false);
                                setSearch('');
                            }}
                            onPressEnter={() => {
                                if (showInviteRow) addEmail(search);
                            }}
                            variant="borderless"
                            style={{ fontSize: 13, padding: '9px 14px' }}
                        />
                    </div>

                    {/* Dropdown list */}
                    {open && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            border: '1px solid #f0f0f0',
                            borderRadius: 8,
                            background: '#fff',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            zIndex: 100,
                            overflow: 'hidden',
                        }}>
                            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                {filtered.length === 0 && !showInviteRow && (
                                    <Flex align="center" justify="center" style={{ padding: '20px 16px' }}>
                                        <Text style={{ fontSize: 13, color: '#bfbfbf' }}>No vendors found</Text>
                                    </Flex>
                                )}

                                {filtered.map((v, idx) => {
                                    const selected = isSelected(v.id);
                                    return (
                                        <Flex
                                            key={v.id}
                                            justify="space-between"
                                            align="center"
                                            onMouseDown={() => { suppressBlur.current = true; }}
                                            onClick={() => toggleVendor(v)}
                                            style={{
                                                padding: '10px 14px',
                                                cursor: 'pointer',
                                                background: selected ? '#fff8f8' : '#fff',
                                                borderBottom: idx < filtered.length - 1 || showInviteRow ? '1px solid #f5f5f5' : 'none',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => { if (!selected) (e.currentTarget as HTMLElement).style.background = '#fafafa'; }}
                                            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = selected ? '#fff8f8' : '#fff'; }}
                                        >
                                            <Flex vertical gap={2}>
                                                <Text style={{ fontSize: 13, fontWeight: 600, color: '#262626' }}>{v.businessName || v.email}</Text>
                                                {v.businessName && (
                                                    <Text style={{ fontSize: 12, color: '#8c8c8c' }}>{v.email}</Text>
                                                )}
                                            </Flex>
                                            {selected && (
                                                <span style={{
                                                    width: 20,
                                                    height: 20,
                                                    borderRadius: '50%',
                                                    background: '#ff4f4f',
                                                    display: 'inline-flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}>
                                                    <CheckOutlined style={{ fontSize: 10, color: '#fff' }} />
                                                </span>
                                            )}
                                        </Flex>
                                    );
                                })}

                                {/* Invite-by-email row */}
                                {showInviteRow && (
                                    <Flex
                                        align="center"
                                        gap={8}
                                        onMouseDown={() => { suppressBlur.current = true; }}
                                        onClick={() => addEmail(search)}
                                        style={{
                                            padding: '10px 14px',
                                            cursor: 'pointer',
                                            background: '#fff',
                                            transition: 'background 0.15s',
                                        }}
                                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#fff8f8'; }}
                                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fff'; }}
                                    >
                                        <MailOutlined style={{ fontSize: 14, color: '#ff4f4f' }} />
                                        <Flex vertical gap={1}>
                                            <Text style={{ fontSize: 13, fontWeight: 600, color: '#ff4f4f' }}>
                                                Invite &quot;{search.trim()}&quot;
                                            </Text>
                                            <Text style={{ fontSize: 11, color: '#8c8c8c' }}>This email is not in your vendor list</Text>
                                        </Flex>
                                    </Flex>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {showError && (
                    <Text style={{ color: '#ff4f4f', fontSize: 12, marginTop: 4, display: 'block' }}>{showError}</Text>
                )}

                {/* Selected vendors list */}
                {(selectedVendors.length > 0 || invitedEmails.length > 0) && (
                    <Flex gap={6} wrap="wrap" style={{ marginTop: 10 }}>
                        {selectedVendors.map(v => (
                            <Flex
                                key={v.id}
                                align="center"
                                gap={4}
                                style={{ padding: '4px 8px 4px 10px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 20, fontSize: 13 }}
                            >
                                <CheckOutlined style={{ fontSize: 11, color: '#52c41a' }} />
                                <Text style={{ fontSize: 13, color: '#262626' }}>{v.businessName || v.email}</Text>
                                <CloseOutlined
                                    style={{ fontSize: 10, color: '#8c8c8c', cursor: 'pointer', marginLeft: 2 }}
                                    onClick={() => {
                                        const next = selectedVendors.filter(s => s.id !== v.id);
                                        setSelectedVendors(next);
                                        setFieldValue('invitedVendors', next.map(s => s.id));
                                        setFieldTouched('invitedVendors', true, false);
                                    }}
                                />
                            </Flex>
                        ))}
                        {invitedEmails.map(email => (
                            <Flex
                                key={email}
                                align="center"
                                gap={4}
                                style={{ padding: '4px 8px 4px 10px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 20, fontSize: 13, flexShrink: 0 }}
                            >
                                <MailOutlined style={{ fontSize: 11, color: '#ff4f4f' }} />
                                <Text style={{ fontSize: 13, color: '#262626' }}>{email}</Text>
                                <Text style={{ fontSize: 12, color: '#b5742f' }}>· Invited</Text>
                                <CloseOutlined
                                    style={{ fontSize: 10, color: '#8c8c8c', cursor: 'pointer', marginLeft: 2 }}
                                    onClick={() => removeEmail(email)}
                                />
                            </Flex>
                        ))}
                    </Flex>
                )}
            </Card>
        </Card>

        <AddVendorDrawer
            open={addVendorOpen}
            onClose={() => setAddVendorOpen(false)}
            onSuccess={refetchVendors}
        />
        </>
    );
};

export default SelectVendors;
