import { useState } from 'react';

import { Flex, Spin, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import BusBookingCard from '../components/BusBookingCard';
import useManageBookingsApi from '../hooks/useManageBookingsApi';
import { BusBooking } from '../types/buslist';

type TabKey = 'upcoming' | 'past';

const TABS: { key: TabKey; label: string }[] = [
    { key: 'upcoming', label: 'Upcoming Ticket' },
    { key: 'past',     label: 'Past and Cancelled' },
];

export default function ManageBookings() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabKey>('upcoming');
    const type = activeTab === 'past' ? 'past' : 'upcoming';
    const { bookings, isLoading } = useManageBookingsApi(type);

    const handleViewTicket = (booking: BusBooking) => {
        navigate(`${paths.dashboard.corporateTravel}/${paths.bus.index}/${paths.bus.bookingConfirmed}`, {
            state: { corporateTxnId: booking.confirmationNumber, canCancel: activeTab === 'upcoming' },
        });
    };

    return (
        <Flex vertical style={{ minHeight: '100vh', padding: '20px 24px' }}>
            {/* Title */}
            <Typography.Title level={3} style={{ margin: '0 0 20px 0', fontWeight: 500 }}>
                Manage Your Bookings
            </Typography.Title>

            {/* Tabs */}
            <div style={{ borderBottom: '1px solid #eaecf0', marginBottom: 24 }}>
                <Flex gap={20}>
                    {TABS.map(tab => {
                        const active = activeTab === tab.key;
                        return (
                            <button
                                key={tab.key}
                                type="button"
                                onClick={() => setActiveTab(tab.key)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    padding: '12px 4px', fontSize: 15, fontWeight: 500,
                                    color: active ? '#ff4f4f' : '#667085',
                                    borderBottom: `2.5px solid ${active ? '#ff4f4f' : 'transparent'}`,
                                    marginBottom: -1,
                                    transition: 'all 0.12s',
                                }}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </Flex>
            </div>

            {/* Booking cards */}
            <Spin spinning={isLoading}>
                <Flex vertical gap={24}>
                    {bookings.length > 0 ? (
                        bookings.map(booking => (
                            <BusBookingCard key={booking.id} booking={booking} onViewTicket={handleViewTicket} onCancelSuccess={() => setActiveTab('past')} showCancel={activeTab === 'upcoming'} />
                        ))
                    ) : (
                        !isLoading && (
                            <Flex justify="center" align="center" style={{ padding: '60px 0' }}>
                                <Typography.Text style={{ color: '#8c8c8c', fontSize: 14 }}>
                                    No bookings found.
                                </Typography.Text>
                            </Flex>
                        )
                    )}
                </Flex>
            </Spin>
        </Flex>
    );
}
