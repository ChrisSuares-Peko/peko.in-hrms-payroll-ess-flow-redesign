import React, { useEffect, useMemo, useState } from 'react';

import {
    CalendarOutlined,
    DownOutlined,
    GlobalOutlined,
    HomeOutlined,
    IdcardOutlined,
    SearchOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { Button, Col, DatePicker, Dropdown, Flex, Input, Row, Typography } from 'antd';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import { useNationalityAndResidency, useVisaDestinations } from '../hooks/useVisaApi';

// ─── Shared field card style ───────────────────────────────────────────────────

const fieldCard = (open = false, error = false): React.CSSProperties => ({
    height: 55,
    background: '#FFFFFF',
    // eslint-disable-next-line no-nested-ternary
    border: `1px solid ${error ? '#ff4d4f' : open ? '#FF4F4F' : '#D9D9D9'}`,
    borderRadius: 12,
    padding: '0 16px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    userSelect: 'none',
});

const valueLine: React.CSSProperties = {
    fontSize: 'clamp(14px, 3vw, 20px)',
    fontWeight: 700,
    color: '#101010',
    lineHeight: '26px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

const subLine: React.CSSProperties = {
    fontSize: 12,
    fontWeight: 500,
    color: '#888888',
    lineHeight: '18px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
};

const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingBottom: 8,
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '22px',
    color: '#000000',
};

// ─── OptionItem ───────────────────────────────────────────────────────────────

const OptionItem = ({
    option,
    selected,
    onSelect,
}: {
    option: SelectOption;
    selected: boolean;
    onSelect: () => void;
}) => {
    const [hovered, setHovered] = useState(false);
    let bg = 'transparent';
    if (selected) bg = '#FFF4F4';
    else if (hovered) bg = '#f5f5f5';
    return (
        <div
            role="option"
            aria-selected={selected}
            tabIndex={0}
            onClick={onSelect}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onSelect(); }}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
                padding: '8px 16px',
                fontSize: 14,
                cursor: 'pointer',
                color: selected ? '#FF4F4F' : '#191C1F',
                background: bg,
            }}
        >
            {option.label}
        </div>
    );
};

// ─── VisaSelectField ──────────────────────────────────────────────────────────

interface SelectOption {
    label: string;
    value: string | number;
}

const VisaSelectField = ({
    fieldLabel,
    subLabel,
    value,
    onChange,
    options,
    icon,
    showSearch = false,
    loading = false,
    placeholder = 'Select',
    error,
}: {
    fieldLabel: string;
    subLabel: string;
    value: string | number | null | undefined;
    onChange: (v: any) => void;
    options: SelectOption[];
    icon: React.ReactNode;
    showSearch?: boolean;
    loading?: boolean;
    placeholder?: string;
    error?: string;
}) => {
    const [open, setOpen] = useState(false);
    const [searchText, setSearchText] = useState('');

    const displayLabel = options.find(o => o.value === value)?.label ?? placeholder;

    const filtered = useMemo(
        () =>
            showSearch && searchText
                ? options.filter(o =>
                      o.label.toLowerCase().includes(searchText.toLowerCase())
                  )
                : options,
        [options, searchText, showSearch]
    );

    const handleClose = () => {
        setOpen(false);
        setSearchText('');
    };

    const dropdownContent = (
        <div
            style={{
                background: '#fff',
                borderRadius: 10,
                boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                minWidth: 220,
                padding: '4px 0',
            }}
        >
            {showSearch && (
                <div style={{ padding: '8px 10px 4px' }}>
                    <Input
                        placeholder="Search..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        size="middle"
                        allowClear
                        autoFocus
                        // Chrome ignores autoComplete="off"/"new-password" for its own "previously
                        // typed values" suggestion popup on plain text inputs. Chrome only decides
                        // whether to show that popup at the moment the field receives focus — so
                        // starting the field readOnly and dropping that attribute inside onFocus
                        // (before any typing happens) reliably keeps the popup from ever attaching,
                        // while typing still works normally right after.
                        readOnly
                        onFocus={e => e.currentTarget.removeAttribute('readonly')}
                        autoComplete="off"
                        name={`visa-select-search-${fieldLabel.replace(/\s+/g, '-').toLowerCase()}`}
                        data-lpignore="true"
                        data-1p-ignore
                    />
                </div>
            )}
            <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                {filtered.map(o => (
                    // Keyed by label, not value: several countries can share the same fallback
                    // value (Number(null) for entries with no vendor code), and a duplicate key
                    // corrupts React's list reconciliation, causing stale/duplicated rows to stick.
                    <OptionItem
                        key={o.label}
                        option={o}
                        selected={o.value === value}
                        onSelect={() => { onChange(o.value); handleClose(); }}
                    />
                ))}
                {filtered.length === 0 && (
                    <div style={{ padding: '10px 16px', color: '#999', fontSize: 13 }}>
                        No results
                    </div>
                )}
            </div>
        </div>
    );

    return (
        <div>
            <Dropdown
                open={open}
                onOpenChange={v => { setOpen(v); if (!v) setSearchText(''); }}
                dropdownRender={() => dropdownContent}
                trigger={['click']}
            >
                <div style={fieldCard(open, !!error)}>
                    <span style={{ flexShrink: 0, color: '#C8BDD0', fontSize: 22 }}>{icon}</span>
                    <Flex vertical gap={1} style={{ flex: 1, minWidth: 0 }}>
                        <Typography.Text
                            style={valueLine}
                            ellipsis={{ tooltip: !loading ? displayLabel : false }}
                        >
                            {loading ? '...' : displayLabel}
                        </Typography.Text>
                        <Typography.Text style={subLine}>{subLabel}</Typography.Text>
                    </Flex>
                    <DownOutlined style={{ fontSize: 10, color: '#AAAAAA', flexShrink: 0 }} />
                </div>
            </Dropdown>
            {error && (
                <Typography.Text style={{ color: '#ff4d4f', fontSize: 12, display: 'block', marginTop: 4 }}>
                    {error}
                </Typography.Text>
            )}
        </div>
    );
};

// ─── VisaDatePicker ───────────────────────────────────────────────────────────

const VisaDatePicker = ({
    value,
    onChange,
    error,
}: {
    value: dayjs.Dayjs | null;
    onChange: (date: dayjs.Dayjs | null) => void;
    error?: string;
}) => (
    <div>
        <div style={{ position: 'relative', height: 55, width: '100%' }}>
            <Flex
                align="center"
                gap={12}
                style={{
                    position: 'absolute',
                    inset: 0,
                    ...fieldCard(false, !!error),
                    pointerEvents: 'none',
                    zIndex: 1,
                }}
            >
                <CalendarOutlined style={{ fontSize: 22, color: '#C8BDD0', flexShrink: 0 }} />
                <Flex vertical gap={1}>
                    <Typography.Text style={valueLine}>
                        {value ? value.format("DD MMM 'YY") : 'Select date'}
                    </Typography.Text>
                    <Typography.Text style={subLine}>
                        {value ? value.format('dddd') : ' '}
                    </Typography.Text>
                </Flex>
            </Flex>
            <DatePicker
                value={value}
                onChange={onChange}
                disabledDate={d => d.isBefore(dayjs(), 'day')}
                style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: 55,
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 2,
                }}
            />
        </div>
        {error && (
            <Typography.Text style={{ color: '#ff4d4f', fontSize: 12, display: 'block', marginTop: 4 }}>
                {error}
            </Typography.Text>
        )}
    </div>
);

// ─── SearchVisa ────────────────────────────────────────────────────────────────

const SearchVisa = () => {
    const navigate = useNavigate();
    const { destinations, isLoading: destLoading } = useVisaDestinations();
    const { nationalityOptions, residencyOptions, isLoading: natResLoading, indiaId } = useNationalityAndResidency();

    const [nationality, setNationality] = useState<number | null>(null);
    const [residency, setResidency] = useState<number | null>(null);
    const [destinationId, setDestinationId] = useState<number | null>(null);
    const [travelDate, setTravelDate] = useState<dayjs.Dayjs | null>(dayjs().add(7, 'day'));
    const [visaType, setVisaType] = useState<string>('Tourist');
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('visa_viewed');
        }
    }, []);

    useEffect(() => {
        if (indiaId !== null) {
            setNationality(prev => prev ?? indiaId);
            setResidency(prev => prev ?? indiaId);
        }
    }, [indiaId]);

    useEffect(() => {
        if (destinations.length > 0 && destinationId === null) {
            const defaultDest = destinations.find(d => d.country_id === 233) ?? destinations[0];
            setDestinationId(defaultDest.country_id);
            setVisaType(defaultDest.visa_categories[0] ?? 'Tourist');
        }
    }, [destinations, destinationId]);

    const selectedDestination = useMemo(
        () => destinations.find(d => d.country_id === destinationId) ?? null,
        [destinations, destinationId]
    );

    const visaCategoryOptions = useMemo<SelectOption[]>(
        () => (selectedDestination?.visa_categories ?? ['Tourist', 'Business']).map(c => ({
            label: c,
            value: c,
        })),
        [selectedDestination]
    );

    const destinationOptions = useMemo<SelectOption[]>(
        () => [...destinations]
            .sort((a, b) => a.destination.localeCompare(b.destination))
            .map(d => ({ label: d.destination, value: d.country_id })),
        [destinations]
    );

    const handleDestinationChange = (id: number) => {
        setDestinationId(id);
        if (errors.destinationId) setErrors(prev => ({ ...prev, destinationId: '' }));
        const dest = destinations.find(d => d.country_id === id);
        if (dest && !dest.visa_categories.includes(visaType)) {
            setVisaType(dest.visa_categories[0] ?? 'Tourist');
        }
    };

    const handleDateChange = (date: dayjs.Dayjs | null) => {
        setTravelDate(date);
        if (errors.travelDate) setErrors(prev => ({ ...prev, travelDate: '' }));
    };

    const handleSearch = () => {
        const newErrors: Record<string, string> = {};
        if (!destinationId) newErrors.destinationId = 'Please select a destination country';
        if (!travelDate) newErrors.travelDate = 'Please select a travel date';
        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        const natLabel = nationalityOptions.find(c => c.value === nationality)?.label ?? '';
        const resLabel = residencyOptions.find(c => c.value === residency)?.label ?? '';
        if (typeof Moengage?.track_event === 'function') {
            Moengage.track_event('visa_search_started', {
                nationality: natLabel,
                residency: resLabel,
                destination: selectedDestination?.destination ?? '',
                visa_type: visaType,
                travel_date: travelDate?.format('YYYY-MM-DD') ?? '',
            });
        }
        navigate(`${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.results}`, {
            state: {
                nationality: natLabel,
                nationalityId: nationality,
                residencyId: residency,
                destination: selectedDestination?.destination ?? '',
                destinationId: selectedDestination?.country_id ?? null,
                visaType,
                travelDate: travelDate?.format('YYYY-MM-DD') ?? '',
            },
        });
    };

    return (
        <div style={{ padding: '16px 12px 20px' }}>
            <Flex
                justify="space-between"
                align="flex-start"
                wrap="wrap"
                gap={12}
                style={{ marginBottom: 24 }}
            >
                <Typography.Text
                    style={{ fontSize: 16, fontWeight: 500, color: '#323232', lineHeight: '24px', flex: 1, minWidth: 120 }}
                >
                    Enter your visa requirement details
                </Typography.Text>
                <Button
                    className="ml-auto h-11 px-6 rounded-lg font-small border border-[#FF4F4F] text-[#FF4F4F] hover:bg-transparent hover:text-[#FF4F4F] hover:border-[#FF4F4F] bg-white"
                    onClick={() =>
                        navigate(
                            `${paths.dashboard.corporateTravel}/${paths.visa.index}/${paths.visa.manageBookings}`
                        )
                    }
                >
                    Track Visa Status
                </Button>
            </Flex>

            <Row gutter={[16, 16]} align="bottom">
                <Col xs={24} sm={12} lg={6}>
                    <Typography.Text style={labelStyle}>Nationality</Typography.Text>
                    <VisaSelectField
                        fieldLabel="Nationality"
                        subLabel="Passport country"
                        value={nationality}
                        onChange={setNationality}
                        options={nationalityOptions}
                        icon={<UserOutlined />}
                        showSearch
                        loading={natResLoading}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Typography.Text style={labelStyle}>Country of Residence</Typography.Text>
                    <VisaSelectField
                        fieldLabel="Country of Residence"
                        subLabel="Where you live"
                        value={residency}
                        onChange={setResidency}
                        options={residencyOptions}
                        icon={<HomeOutlined />}
                        showSearch
                        loading={natResLoading}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Typography.Text style={labelStyle}>Destination Country</Typography.Text>
                    <VisaSelectField
                        fieldLabel="Destination Country"
                        subLabel="Travelling to"
                        value={destinationId}
                        onChange={handleDestinationChange}
                        options={destinationOptions}
                        icon={<GlobalOutlined />}
                        showSearch
                        loading={destLoading}
                        placeholder="Select destination"
                        error={errors.destinationId}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Typography.Text style={labelStyle}>Visa Type</Typography.Text>
                    <VisaSelectField
                        fieldLabel="Visa Type"
                        subLabel="Category"
                        value={visaType}
                        onChange={setVisaType}
                        options={visaCategoryOptions}
                        icon={<IdcardOutlined />}
                    />
                </Col>

                <Col xs={24} sm={12} lg={6}>
                    <Typography.Text style={labelStyle}>Travel Date</Typography.Text>
                    <VisaDatePicker value={travelDate} onChange={handleDateChange} error={errors.travelDate} />
                </Col>

                <Col xs={24} sm={12} lg={4}>
                    <Button
                        type="primary"
                        size="large"
                        className="w-full"
                        style={{
                            backgroundColor: '#FF4F4F',
                            borderColor: '#FF4F4F',
                            height: 55,
                            borderRadius: 12,
                            fontSize: 14,
                            fontWeight: 500,
                        }}
                        onClick={handleSearch}
                        icon={<SearchOutlined style={{ fontSize: 16 }} />}
                    >
                        Search Visa
                    </Button>
                </Col>
            </Row>
        </div>
    );
};

export default SearchVisa;
