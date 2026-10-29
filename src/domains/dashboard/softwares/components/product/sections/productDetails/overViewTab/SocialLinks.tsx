import React from 'react';

import {
    FacebookOutlined,
    InstagramOutlined,
    LinkedinOutlined,
    TwitterOutlined,
    WhatsAppOutlined,
} from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

const { Link, Text } = Typography;

const SOCIAL_ICONS: Record<string, React.ElementType> = {
    instagram: InstagramOutlined,
    facebook: FacebookOutlined,
    linkedin: LinkedinOutlined,
    twitter: TwitterOutlined,
    whatsapp: WhatsAppOutlined,
};

const SocialLinks = () => {
    const { product } = useProductContext();

    const socialLinks = Object.entries(product?.social_links || {})
        .filter(([key, value]) => SOCIAL_ICONS[key] && value)
        .map(([key, value]) => ({
            key,
            link: value,
            Icon: SOCIAL_ICONS[key],
        }));

    return (
        <Flex gap={12} wrap="wrap">
            {socialLinks.map(({ key, link, Icon }) => (
                <Flex
                    key={key}
                    align="center"
                    className="px-3 py-2 border rounded-lg border-opacity-10"
                    style={{ width: 'fit-content' }}
                >
                    <Link
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                    >
                        <Icon className="text-sm" />
                        <Text className="text-base font-normal ">
                            {key[0].toUpperCase()}
                            {key.slice(1)}
                        </Text>
                    </Link>
                </Flex>
            ))}
        </Flex>
    );
};

export default SocialLinks;
