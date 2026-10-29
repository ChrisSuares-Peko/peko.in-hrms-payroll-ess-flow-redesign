import { Anchor, Card, Divider, Flex, Grid, List, Space, Table, Tag, Typography } from 'antd';

const { Title, Paragraph, Text, Link } = Typography;
const { useBreakpoint } = Grid;

const DOMAIN_ROWS = [
    { key: 'RET10', code: 'ONDC:RET10', name: 'Grocery' },
    { key: 'RET14', code: 'ONDC:RET14', name: 'Electronics' },
    { key: 'RET16', code: 'ONDC:RET16', name: 'Home & Kitchen' },
    { key: 'RET18', code: 'ONDC:RET18', name: 'Health & Wellness' },
];

const LISTING_ROWS = [
    {
        key: 'search',
        parameter: 'Search term / category',
        how: 'Only matching products are shown (name, short description, or long description; word-boundary match). Among matches, order is product name A–Z. There is no relevance score, popularity, or rating rank.',
    },
    {
        key: 'browse',
        parameter: 'Browse (no search term)',
        how: 'The stored city catalog is shown in product-name A–Z order.',
    },
    {
        key: 'distance',
        parameter: 'Distance from buyer',
        how: 'Not used to rank. The catalog is limited to sellers that serve the buyer’s ONDC city code.',
    },
    {
        key: 'sponsored',
        parameter: 'Sponsored results',
        how: 'None. All results are organic.',
    },
    {
        key: 'visibility',
        parameter: 'Visibility',
        how: 'Products hidden by Peko, or in categories an administrator has disabled, are omitted. Statutory blocks from catalog are stored; they are not used to reject listings. A missing image does not hide a product from the main grid.',
    },
];

const IGM_ROWS = [
    { key: 'open', status: 'Open', meaning: 'The issue has been raised.' },
    {
        key: 'processing',
        status: 'Processing',
        meaning:
            'The seller is working the issue (including information requests and proposed resolutions).',
    },
    {
        key: 'resolved',
        status: 'Resolved',
        meaning:
            'The seller has sent action RESOLVED. A proposed resolution alone is not treated as resolved.',
    },
    {
        key: 'closed',
        status: 'Closed',
        meaning:
            'The issue is closed. Closing does not send /update and does not by itself refund or replace.',
    },
];

const ANCHOR_ITEMS = [
    { key: 'catalog', href: '#catalog', title: 'Catalog' },
    { key: 'orders', href: '#orders', title: 'Orders' },
    { key: 'cancellations', href: '#cancellations', title: 'Cancellations' },
    { key: 'returns', href: '#returns', title: 'Returns' },
    { key: 'refunds', href: '#refunds', title: 'Refunds' },
    { key: 'igm', href: '#igm', title: 'IGM' },
    { key: 'payouts', href: '#payouts', title: 'Payouts' },
    { key: 'contact', href: '#contact', title: 'Contact' },
];

const tableScroll = { x: 'max-content' };

/**
 * Public ONDC Buyer NP static terms — no AuthGuard.
 * Mirrors repo-root ondc-static-terms.html for hosting on the Buyer App origin.
 */
const OndcStaticTermsPage = () => {
    const screens = useBreakpoint();
    const isDesktop = Boolean(screens.md);

    return (
        <Flex className="min-h-screen bg-neutral-50 px-3 py-4 sm:px-6 sm:py-8 md:px-8">
            <Card className="mx-auto w-full max-w-4xl" bordered>
                <Flex vertical gap={8}>
                    <Title level={screens.sm ? 2 : 3} className="!mb-0">
                        Peko — Buyer NP Static Terms of Trade
                    </Title>
                    <Space wrap size={[8, 8]}>
                        <Tag>Version 1.0</Tag>
                        <Tag>Effective 20 August 2026</Tag>
                        <Tag>Retail protocol 1.2.x</Tag>
                    </Space>
                    <Paragraph className="!mb-0">
                        These terms describe how Peko, acting as a Buyer Network Participant (Buyer
                        App) on the Open Network for Digital Commerce (ONDC), discovers catalogs,
                        places orders, handles cancellations, returns, refunds, issues, and settles
                        seller payouts. They apply to Office Supplies on{' '}
                        <Text strong>ONDC:RET10</Text>, <Text strong>ONDC:RET14</Text>,{' '}
                        <Text strong>ONDC:RET16</Text>, and <Text strong>ONDC:RET18</Text>.
                    </Paragraph>
                    <Anchor
                        affix={false}
                        direction={isDesktop ? 'horizontal' : 'vertical'}
                        items={ANCHOR_ITEMS}
                        className="overflow-x-auto"
                    />
                </Flex>

                <Divider />

                <section id="catalog">
                    <Title level={4}>1. Catalog and listing</Title>
                    <Paragraph>
                        Peko uses <Text strong>on-demand</Text> search. When a buyer opens Office
                        Supplies for a city, Peko searches the ONDC network for that city if it has
                        no stored catalog, or if the stored catalog is stale. Concurrent visitors to
                        the same city share one search. Products that arrive are stored and listed
                        as received.
                    </Paragraph>
                    <Paragraph>Peko searches these domains on demand:</Paragraph>
                    <Table
                        size="small"
                        pagination={false}
                        scroll={tableScroll}
                        rowKey="key"
                        dataSource={DOMAIN_ROWS}
                        columns={[
                            { title: 'Category code', dataIndex: 'code', key: 'code' },
                            { title: 'Category name', dataIndex: 'name', key: 'name' },
                        ]}
                    />
                    <Table
                        className="mt-4"
                        size="small"
                        pagination={false}
                        scroll={tableScroll}
                        rowKey="key"
                        dataSource={LISTING_ROWS}
                        columns={[
                            {
                                title: 'Parameter',
                                dataIndex: 'parameter',
                                key: 'parameter',
                                width: 180,
                            },
                            { title: 'How listing works', dataIndex: 'how', key: 'how' },
                        ]}
                    />
                    <Paragraph className="!mt-4 !mb-0">
                        If the city already has a stored catalog, buyers see it immediately. Keyword
                        and category search on the storefront filter that catalog locally; they do
                        not send a new network search for each query.
                    </Paragraph>
                </section>

                <Divider />

                <section id="orders">
                    <Title level={4}>2. Orders</Title>
                    <Paragraph>
                        The buyer selects items, provides delivery details, and confirms the order
                        on the ONDC network (<Text code>/select</Text>, <Text code>/init</Text>,{' '}
                        <Text code>/confirm</Text>). Payment is collected by Peko through its
                        payment gateway (Cashfree). The seller’s share is split at confirmation and
                        held until payout eligibility (see Payouts).
                    </Paragraph>
                    <List
                        size="small"
                        dataSource={[
                            <>
                                Order state follows the seller’s <Text code>on_confirm</Text>,{' '}
                                <Text code>on_status</Text>, and <Text code>on_update</Text>{' '}
                                callbacks. Peko does not invent order states or delivery dates.
                            </>,
                            'Expected delivery, where shown, comes from the seller’s declared time-to-ship / TAT. If the seller omitted an estimate, delay for refund purposes is judged 24 hours after order placement.',
                            'Tracking and live status refresh are requested when the buyer asks for them; they are not polled on every page load.',
                        ]}
                        renderItem={item => <List.Item>{item}</List.Item>}
                    />
                </section>

                <Divider />

                <section id="cancellations">
                    <Title level={4}>3. Cancellations</Title>
                    <Paragraph>
                        The buyer or Peko operations may cancel an order{' '}
                        <Text strong>before the shipment is picked up</Text>, subject to the
                        seller’s cancellable flag and ONDC cancellation reasons.
                    </Paragraph>
                    <List
                        size="small"
                        dataSource={[
                            'After pickup (Order-picked-up, in-transit, out-for-delivery, or delivered), a normal cancel is not offered.',
                            <>
                                A force cancellation (RTO) may be used when the seller’s policy
                                would otherwise block cancel, or after the parcel has left the
                                seller, in line with ONDC <Text code>force = yes</Text>.
                            </>,
                            'An order that is already Cancelled or Completed cannot be cancelled again.',
                            'When the seller confirms the cancel, Peko refunds amounts still refundable to the buyer (see Refunds). The seller is not paid for a cancelled, undelivered order.',
                        ]}
                        renderItem={item => <List.Item>{item}</List.Item>}
                    />
                </section>

                <Divider />

                <section id="returns">
                    <Title level={4}>4. Returns</Title>
                    <Paragraph>
                        After delivery, the buyer may request a return if the seller marked the item
                        returnable and the request is within the return window.
                    </Paragraph>
                    <List
                        size="small"
                        dataSource={[
                            <>
                                The return window is the duration declared by the seller on catalog (
                                <Text code>@ondc/org/return_window</Text>).
                            </>,
                            <>
                                If the seller did not declare a window, Peko uses a default of{' '}
                                <Text strong>P2D</Text> (2 days) from delivery.
                            </>,
                            <>
                                The buyer may ask for a <Text strong>return</Text> or a{' '}
                                <Text strong>replace</Text> (<Text code>replace: yes | no</Text> on{' '}
                                <Text code>/update</Text>).
                            </>,
                            <>
                                <Text strong>Replace does not refund.</Text> A replacement is
                                fulfilled by the seller; money already paid is not returned.
                            </>,
                            <>
                                Refund on a return is paid only when a Return fulfillment reaches{' '}
                                <Text code>Liquidated</Text>, <Text code>Return_Picked</Text>, or{' '}
                                <Text code>Return_Delivered</Text>, and the request is not a replace.
                            </>,
                            'A seller-only catalog update with no Return fulfillment does not trigger a refund.',
                        ]}
                        renderItem={item => <List.Item>{item}</List.Item>}
                    />
                </section>

                <Divider />

                <section id="refunds">
                    <Title level={4}>5. Refunds</Title>
                    <Paragraph>
                        Refunds are paid to the buyer through Cashfree. Money moves in these cases
                        only:
                    </Paragraph>
                    <List
                        size="small"
                        dataSource={[
                            'The order is cancelled (buyer, admin, or accepted seller cancel) and an amount remains refundable.',
                            'A genuine return reaches Liquidated, Return_Picked, or Return_Delivered and is not a replace.',
                            'An undelivered order is delayed past the promised (or fallback) delivery time, seller payout is still held, and operations issues a refund.',
                        ]}
                        renderItem={(item, index) => (
                            <List.Item>
                                {index + 1}. {item}
                            </List.Item>
                        )}
                    />
                    <Paragraph>
                        Accepting an IGM resolution whose code is <Text code>REFUND</Text> does{' '}
                        <Text strong>not</Text> by itself pay Cashfree. Refund still follows cancel
                        or return as above.
                    </Paragraph>
                    <Paragraph className="!mb-0">
                        The amount refunded is split in the same ratio as collection: the seller’s
                        Easy Split share and Peko’s finder / platform share. A full refund returns
                        the seller’s remaining allocation in full. Duplicate refunds of the same
                        amount are rejected.
                    </Paragraph>
                </section>

                <Divider />

                <section id="igm">
                    <Title level={4}>6. Issue and grievance management (IGM)</Title>
                    <Paragraph>
                        The buyer may raise an issue on a confirmed order (for example product
                        quality, missing item, or fulfillment delay) through ONDC IGM. Peko
                        forwards the issue to the seller and records callbacks.
                    </Paragraph>
                    <Table
                        size="small"
                        pagination={false}
                        scroll={tableScroll}
                        rowKey="key"
                        dataSource={IGM_ROWS}
                        columns={[
                            { title: 'Status shown to the buyer', dataIndex: 'status', key: 'status', width: 160 },
                            { title: 'Meaning', dataIndex: 'meaning', key: 'meaning' },
                        ]}
                    />
                    <List
                        className="mt-2"
                        size="small"
                        dataSource={[
                            'The buyer may accept or reject a proposed resolution (refund, replacement, return, or cancel) as offered by the seller.',
                            'Escalation follows the ONDC IGM protocol.',
                            'Peko does not automatically unpublish a seller for complaint volume.',
                        ]}
                        renderItem={item => <List.Item>{item}</List.Item>}
                    />
                </section>

                <Divider />

                <section id="payouts">
                    <Title level={4}>7. Payouts to seller Network Participants</Title>
                    <Paragraph>
                        Money is settled to seller Network Participants net of the following, as
                        applicable:
                    </Paragraph>
                    <List
                        size="small"
                        dataSource={[
                            'Buyer Finder Fees',
                            'Applicable taxes',
                            'Promotions, if any',
                            'Returns',
                        ]}
                        renderItem={item => <List.Item>{item}</List.Item>}
                    />
                    <Paragraph>
                        The seller’s share is{' '}
                        <Text strong>held until the order’s return window has closed</Text>, then
                        released.
                    </Paragraph>
                    <List
                        size="small"
                        dataSource={[
                            <>
                                Return window: seller <Text code>@ondc/org/return_window</Text>, or{' '}
                                <Text strong>P2D</Text> if omitted.
                            </>,
                            <>
                                A buffer of <Text strong>PT12H</Text> (12 hours) is added so a
                                return filed on the last day can still reach Peko before payout.
                            </>,
                            'After the window plus buffer, an hourly payout sweep releases the seller share.',
                            'If the order is cancelled or refunded before payout, the seller is not paid that amount.',
                        ]}
                        renderItem={item => <List.Item>{item}</List.Item>}
                    />
                    <Paragraph>
                        Seller Network Participants are responsible for validating settlement
                        details. Issues or queries on settlements shall be entertained within a
                        maximum of <Text strong>7 days</Text> of providing the payment details.
                    </Paragraph>
                    <Paragraph className="!mb-0">
                        Peko does not automatically unpublish a seller when SLA violations exceed
                        10% of orders. Delivery performance is tracked for operations.
                    </Paragraph>
                </section>

                <Divider />

                <section id="contact">
                    <Title level={4}>8. Contact</Title>
                    <Paragraph>
                        If you believe these terms are not being followed, or a listing or
                        settlement is incorrect, contact{' '}
                        <Link href="mailto:reach@peko.one">reach@peko.one</Link> with the order
                        or catalog details. Peko will review the case.
                    </Paragraph>
                </section>

                <Divider />

                <Flex vertical gap={4}>
                    <Text type="secondary">Peko Buyer Network Participant · Static Terms of Trade</Text>
                    <Text type="secondary">Version: 1.0 | Last updated: 20 August 2026</Text>
                </Flex>
            </Card>
        </Flex>
    );
};

export default OndcStaticTermsPage;
