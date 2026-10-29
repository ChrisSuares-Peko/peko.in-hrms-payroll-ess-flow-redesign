import React from 'react';

import { Divider, Flex, Modal, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import Paragraph from 'antd/es/typography/Paragraph';

interface modalProps {
    handleCancel: () => void;
    open: boolean;
}
const AboutModal = ({ handleCancel, open }: modalProps) => (
        <Modal title="About" open={open} onCancel={handleCancel} footer={null} width={800}>
            <Divider />

            <Content className="px-4 " style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                <Typography.Text className="font-medium text-lg  mt-3">
                    WhatsApp Chatbot Builder: What&rsquo;s in it for You?
                </Typography.Text>
                <Typography.Paragraph className="mt-3">
                    The WhatsApp Chatbot Builder is an easy-to-use tool that helps your business
                    automate customer interactions on WhatsApp without needing any technical skills.
                    With this add-on, you can create personalized chatbots that respond to customer
                    queries, share information, and even handle simple tasks like bookings or
                    payments - automatically and 24/7.
                </Typography.Paragraph>
                <Flex vertical className="mt-3">
                    <Typography.Text className="font-medium text-lg">
                        How Can It Help Your Business?
                    </Typography.Text>
                </Flex>
                <Paragraph className="mt-3">
                    <ol style={{ paddingInlineStart: '0' }}>
                        {[
                            'Save Time and Effort: Automate repetitive tasks like answering FAQs, sending updates, or managing bookings, so you can focus on growing your business. ',
                            'Available Anytime: Your chatbot works round-the-clock to engage with customers, even when you’re offline. ',
                            'Easy to Use: No coding required—just use templates or a simple drag-and-drop interface to set up your chatbot. ',
                            'Improve Customer Experience: Offer instant responses and personalized support to keep your customers happy. ',
                            'Scale with Ease: Handle multiple conversations at once, even during peak times. ',
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
                            <strong>Answer FAQs Automatically:</strong>
                            <br /> Example: If you own a clothing store, your chatbot can answer
                            questions like “What are your store hours?” or “Do you offer free
                            shipping?”
                        </li>
                        <li style={{ marginBottom: '0.5em' }}>
                            <strong>Share Product or Service Details:</strong>
                            <br /> Example: A salon can send pricing lists, available services, or
                            special offers when customers inquire.
                        </li>
                        <li style={{ marginBottom: '0.5em' }}>
                            <strong>Take Orders or Bookings:</strong>
                            <br /> Example: A restaurant can accept table reservations or take
                            delivery orders through the chatbot.
                        </li>
                        <li style={{ marginBottom: '0.5em' }}>
                            <strong>Send Updates or Reminders:</strong>
                            <br /> Example: A small clinic can remind patients of upcoming
                            appointments or share health tips.
                        </li>
                        <li style={{ marginBottom: '0.5em' }}>
                            <strong>Collect Feedback:</strong>
                            <br /> Example: After a purchase, you can use the chatbot to ask
                            customers for their feedback on your products or services.
                        </li>
                    </ol>
                </Typography.Paragraph>

                <Typography.Text className="font-medium text-lg mt-3">
                    Why Choose the WhatsApp Chatbot Builder?
                </Typography.Text>
                <Typography.Paragraph className="mt-3">
                    This add-on is designed to help small and medium-sized businesses like yours
                    improve customer engagement while saving valuable time and resources. Whether
                    you&rsquo;re managing a retail shop, a service business, or any SMB, this tool
                    can simplify your daily operations and help you provide excellent service to
                    your customers.
                </Typography.Paragraph>
            </Content>
        </Modal>
    );

export default AboutModal;
