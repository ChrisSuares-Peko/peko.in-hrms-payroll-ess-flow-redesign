import { Collapse, Typography } from 'antd';

const { Title, Text } = Typography;

interface FAQ {
    question: string;
    answer: string;
}

interface FAQsSectionProps {
    hostingFaqs: FAQ[];
}

export const FAQsSection = ({ hostingFaqs }: FAQsSectionProps) => (
    <div className="mb-4 sm:mb-6 px-4 sm:px-6 pt-0 pb-8 sm:pb-10 max-w-7xl mx-auto">
        <Title level={3} className="font-bold" style={{ marginTop: 0 }}>
            Product FAQs
        </Title>
        <div className="mt-5" />
        <Collapse
            ghost
            bordered={false}
            items={hostingFaqs.map((faq, idx) => ({
                key: idx,
                label: <span className="font-semibold">{faq.question}</span>,
                children: <Text className="text-gray-700">{faq.answer}</Text>,
            }))}
        />
    </div>
);
