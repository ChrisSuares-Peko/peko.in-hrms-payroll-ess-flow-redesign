import { JSXElementConstructor, ReactElement } from 'react';

import { LinkOutlined } from '@ant-design/icons';
import { Typography } from 'antd';

export const NavText = (
    text: any,
    isActive: boolean,
    label?: 'free' | 'new' | 'portal'
): ReactElement<string | JSXElementConstructor<any>> => {
    const { Text } = Typography;
    const tone = isActive ? 'text-brandColor' : 'text-navTextColor';

    if (label === 'portal') {
        return (
            <Text className={`flex w-full items-center justify-between gap-2 ${tone}`}>
                <span className="min-w-0 truncate">{text}</span>
                <LinkOutlined className="shrink-0 text-sm text-bgOrange2" />
            </Text>
        );
    }

    return (
        <Text className={tone}>
            {text}
            {label === 'free' && <sup className="ml-3 text-textGreenLight">Free</sup>}
            {label === 'new' && <sup className="ml-3 text-bgOrange2">New</sup>}
        </Text>
    );
};
