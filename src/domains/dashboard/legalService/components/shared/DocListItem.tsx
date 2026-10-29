import { RightOutlined } from '@ant-design/icons';
import { Flex, Tag } from 'antd';
import { ReactSVG } from 'react-svg';

import TypographyText from '@components/atomic/typography/typographyText';

import FallbackDocIcon from '../../assets/icons/document-text.svg';
import type { LegalDocStatus } from '../../types';

interface DocListItemProps {
    iconSrc?: string;
    title: string;
    subTitle?: string;
    status: LegalDocStatus;
    showChevron?: boolean;
    iconBg?: string;
    rowBg?: string;
    onClick?: () => void;
    onActionClick?: () => void;
}

const DocListItem = ({
    iconSrc,
    title,
    subTitle,
    status,
    showChevron = false,
    iconBg = 'bg-white shadow-sm',
    rowBg = 'bg-white',
    onClick,
    onActionClick,
}: DocListItemProps) => (
    <Flex
        justify="space-between"
        align="center"
        className={`py-3 px-4 rounded-2xl ${rowBg} hover:bg-pink-50 transition-colors cursor-pointer`}
        onClick={onClick}
    >
        <Flex align="center" gap={12} className="min-w-0 flex-1">
            <Flex
                align="center"
                justify="center"
                className={`w-9 h-9 flex-shrink-0 rounded-lg ${iconBg}`}
            >
                <ReactSVG
                    src={iconSrc ?? FallbackDocIcon}
                    beforeInjection={svg => {
                        svg.setAttribute('width', '24');
                        svg.setAttribute('height', '24');
                    }}
                />
            </Flex>
            <Flex vertical gap={2} className="min-w-0">
                <TypographyText className="text-gray-800 text-sm font-medium font-['Roboto'] leading-5 block truncate">
                    {title}
                </TypographyText>
                {subTitle ? (
                    <TypographyText className="text-gray-400 text-xs font-normal font-['Roboto'] block truncate">
                        {subTitle}
                    </TypographyText>
                ) : null}
            </Flex>
        </Flex>

        <Flex align="center" gap={8} className="flex-shrink-0">
            {status === 'Signed' ? (
                <Tag
                    className="rounded-full text-xs font-medium m-0 px-3 py-1"
                    style={{ background: 'white', color: '#1a7f37', border: '1px solid #1a7f37' }}
                >
                    Signed
                </Tag>
            ) : (
                <Tag
                    className="rounded-full text-xs font-medium m-0 px-3 py-1 cursor-pointer hover:!border-[#FF3A3A] hover:!text-[#FF3A3A]"
                    style={{ background: 'white', color: '#7c6fb0', border: '1px solid #c4b5fd' }}
                    onClick={e => {
                        e.stopPropagation();
                        onActionClick?.();
                    }}
                >
                    {status}
                </Tag>
            )}
            {showChevron && <RightOutlined className="text-gray-300 text-xs" />}
        </Flex>
    </Flex>
);

export default DocListItem;
