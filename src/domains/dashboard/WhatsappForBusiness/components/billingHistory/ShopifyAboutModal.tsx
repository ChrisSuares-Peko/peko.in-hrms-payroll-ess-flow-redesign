import React from 'react';

import { Divider, Flex, Modal, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Paragraph from 'antd/es/typography/Paragraph';

interface modalProps {
    handleCancel: () => void;
    open: boolean;
}
const ShopifyAboutModal = ({ handleCancel, open }: modalProps) => (
    <Modal title="About" open={open} onCancel={handleCancel} footer={null} width={800}>
        <Divider />

        <Content className="px-4 " style={{ maxHeight: '70vh', overflowY: 'auto' }}>
            <Typography.Text className="font-medium text-lg  mt-3">
                Shopify Integration: What&rsquo;s in it for You?
            </Typography.Text>
            <Typography.Paragraph className="mt-3">
                The Shopify Integration is a plug-and-play add-on that connects your Shopify store
                directly to WhatsApp, letting you automate order and customer communication without
                any coding. Once connected, every stage of the customer journey — from an abandoned
                cart to a delivered order — can trigger an automatic WhatsApp message, keeping
                customers informed and driving more sales back to your store.
            </Typography.Paragraph>
            <Flex vertical className="mt-3">
                <Typography.Text className="font-medium text-lg">
                    How Can It Help Your Business?
                </Typography.Text>
            </Flex>
            <Paragraph className="mt-3">
                <ol style={{ paddingInlineStart: '0' }}>
                    {[
                        'Recover Lost Sales: Automatically remind customers who leave items in their cart to come back and complete their purchase.',
                        'Available Anytime: Order confirmations, shipping updates, and delivery notifications go out instantly, 24/7, without manual follow-up.',
                        'Easy to Set Up: One-click install from the Shopify App Store — just connect your store token and your flows are ready to go live.',
                        'Reduce Returns & Failed Deliveries: Confirm Cash-on-Delivery (COD) orders over WhatsApp to cut down on RTO (Return to Origin) and encourage prepaid orders.',
                        'Personalize at Scale: Automatically pull in the right product image, name, and price into every message, so cart reminders and order updates feel tailored to each customer.',
                    ].map((item, index) => (
                        <li key={index} style={{ marginBottom: '0.5em' }}>
                            {item}
                        </li>
                    ))}
                </ol>
            </Paragraph>
            <Typography.Text className="font-medium text-lg mt-3">
                Where Can You Use It?
            </Typography.Text>
            <Typography.Paragraph className="mt-3">
                <ol style={{ paddingInlineStart: '0' }}>
                    <li style={{ marginBottom: '0.5em' }}>
                        <strong>Abandoned Cart Recovery:</strong>
                        <br /> Example: A customer adds a jacket to their cart but doesn&rsquo;t
                        check out — they automatically get a WhatsApp reminder with the product and
                        a link to complete the purchase.
                    </li>
                    <li style={{ marginBottom: '0.5em' }}>
                        <strong>Order &amp; Shipping Updates:</strong>
                        <br /> Example: The moment an order is placed, the customer gets an order
                        confirmation on WhatsApp, followed by shipping and delivery updates as the
                        order moves.
                    </li>
                    <li style={{ marginBottom: '0.5em' }}>
                        <strong>COD Order Confirmation:</strong>
                        <br /> Example: A customer placing a Cash-on-Delivery order is asked to
                        confirm it on WhatsApp before it ships, reducing cancelled or failed
                        deliveries.
                    </li>
                    <li style={{ marginBottom: '0.5em' }}>
                        <strong>Post-Delivery Feedback:</strong>
                        <br /> Example: After an order is delivered, the customer receives a
                        WhatsApp message asking them to rate their experience or leave a review.
                    </li>
                    <li style={{ marginBottom: '0.5em' }}>
                        <strong>Reorder &amp; Promotional Nudges:</strong>
                        <br /> Example: A skincare brand can remind customers to restock a product
                        they bought before, or send a limited-time offer to bring them back to the
                        store.
                    </li>
                </ol>
            </Typography.Paragraph>

            <Typography.Text className="font-medium text-lg mt-3">
                Why Choose the Shopify Integration?
            </Typography.Text>
            <Typography.Paragraph className="mt-3">
                This add-on is built for Shopify sellers who want to turn WhatsApp into an active
                sales and support channel — not just a chat app. Whether you&rsquo;re running a D2C
                brand, a small retail store, or scaling an ecommerce business, it helps you recover
                more carts, reduce failed deliveries, and keep customers engaged at every step, all
                without adding manual work for your team.
            </Typography.Paragraph>
        </Content>
    </Modal>
);

export default ShopifyAboutModal;
