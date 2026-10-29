import { CollapseProps, Typography } from 'antd';

import { faqText, faqTitle } from '../utils/data';

const { Text } = Typography;

export const items: CollapseProps['items'] = [
    {
        key: '1',
        label: <Text className="ms-6 font-semibold text-base text-faqText">{faqTitle}</Text>,
        children: (
            <Text className="text-faqText" style={{ whiteSpace: 'pre-line' }}>
                {faqText}
            </Text>
        ),
    },
    {
        key: '2',
        label: <Text className="ms-6 font-semibold text-base text-faqText">{faqTitle}</Text>,
        children: (
            <Text className="text-faqText" style={{ whiteSpace: 'pre-line' }}>
                {faqText}
            </Text>
        ),
    },
    {
        key: '3',
        label: <Text className="ms-6 font-semibold text-base text-faqText">{faqTitle}</Text>,
        children: (
            <Text className="text-faqText" style={{ whiteSpace: 'pre-line' }}>
                {faqText}
            </Text>
        ),
    },
    {
        key: '4',
        label: <Text className="ms-6 font-semibold text-base text-faqText">{faqTitle}</Text>,
        children: (
            <Text className="text-faqText" style={{ whiteSpace: 'pre-line' }}>
                {faqText}
            </Text>
        ),
    },
    {
        key: '5',
        label: <Text className="ms-6 font-semibold text-base text-faqText">{faqTitle}</Text>,
        children: (
            <Text className="text-faqText" style={{ whiteSpace: 'pre-line' }}>
                {faqText}
            </Text>
        ),
    },
    {
        key: '6',
        label: <Text className="ms-6 font-semibold text-base text-faqText">{faqTitle}</Text>,
        children: (
            <Text className="text-faqText" style={{ whiteSpace: 'pre-line' }}>
                {faqText}
            </Text>
        ),
    },
    {
        key: '7',
        label: <Text className="ms-6 font-semibold text-base text-faqText">{faqTitle}</Text>,
        children: (
            <Text className="text-faqText" style={{ whiteSpace: 'pre-line' }}>
                {faqText}
            </Text>
        ),
    },
];
