import { DownOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import { formatMoney, toneClasses } from './cashFlowStatement.constants';
import { CfRow, CfSection } from '../../utils/cashFlowData';

const { Text } = Typography;

interface CashFlowSectionProps {
    section: CfSection;
    open?: boolean;
    onToggle: (id: string) => void;
}

const CashFlowSection = ({ section, open, onToggle }: CashFlowSectionProps) => {
    const tone = toneClasses(section.tone);

    return (
        <Flex vertical gap={6} className="overflow-hidden rounded-xl border border-borderStrong">
            <Flex
                role="button"
                tabIndex={0}
                align="center"
                justify="space-between"
                onClick={() => onToggle(section.id)}
                onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onToggle(section.id);
                    }
                }}
                className={`cursor-pointer px-3 py-2 ${tone.header}`}
            >
                <Text className="min-w-0 break-words font-medium">{section.title}</Text>
                <DownOutlined className={open ? '' : 'rotate-180'} />
            </Flex>

            {open && (
                <Flex vertical className="px-3 pb-2">
                    {section.rows.map((row: CfRow, index) =>
                        row.isSubheading ? (
                            <Text
                                key={`${section.id}-${row.label}-${index}`}
                                className="mt-2 text-xs font-medium tracking-wide text-slate-400"
                            >
                                {row.label}
                            </Text>
                        ) : (
                            <Flex
                                key={`${section.id}-${row.label}-${index}`}
                                justify="space-between"
                                className="border-b border-slate-100 py-1.5"
                            >
                                <Text className="min-w-0 break-words text-sm text-slate-500">
                                    {row.label}
                                </Text>
                                <Text
                                    className={`shrink-0 whitespace-nowrap pl-2 text-sm ${
                                        (row.amount ?? 0) < 0 ? 'text-danger' : 'text-bodyText'
                                    }`}
                                >
                                    {formatMoney(row.amount ?? 0)}
                                </Text>
                            </Flex>
                        )
                    )}

                    <Flex
                        justify="space-between"
                        className={`mt-2 rounded-lg px-3 py-2 ${tone.net}`}
                    >
                        <Text className="min-w-0 break-words font-medium text-ink">
                            {section.net.label}
                        </Text>
                        <Text
                            className={`shrink-0 whitespace-nowrap pl-2 font-semibold ${tone.amount}`}
                        >
                            {formatMoney(section.net.amount)}
                        </Text>
                    </Flex>
                </Flex>
            )}
        </Flex>
    );
};

export default CashFlowSection;
