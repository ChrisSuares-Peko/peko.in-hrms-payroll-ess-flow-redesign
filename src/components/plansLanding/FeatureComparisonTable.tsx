import React from 'react';

import { AppstoreOutlined, MinusOutlined } from '@ant-design/icons';
import { Flex, Typography } from 'antd';

import useInView from '@hooks/useInView';
import {
    compareSection,
    comparisonTableAnchorId,
    type ComparisonCell,
    type ComparisonColumn,
    type ComparisonFeature,
} from '@utils/plansLandingData';

import checkSeal from './assets/check-seal.svg';

interface Props {
    columns: ComparisonColumn[];
    rows: ComparisonFeature[];
}

const CheckMark: React.FC = () => (
    <img src={checkSeal} alt="Included" className="mx-auto h-5 w-5" />
);

const ComingSoonPill: React.FC = () => (
    <span className="inline-block rounded-full bg-gray-50 px-2.5 py-0.5 text-xs font-medium text-gray-500">
        Coming Soon
    </span>
);

const Cell: React.FC<{ cell: ComparisonCell }> = ({ cell }) => {
    if (cell.kind === 'check') return <CheckMark />;
    if (cell.kind === 'soon') return <ComingSoonPill />;
    if (cell.kind === 'none') return <MinusOutlined className="text-sm text-gray-300" />;
    return (
        <Typography.Text className="text-xs leading-relaxed text-textGray">
            {cell.value}
        </Typography.Text>
    );
};

const FeatureComparisonTable: React.FC<Props> = ({ columns, rows }) => {
    const { ref, inView } = useInView<HTMLDivElement>();

    if (!columns.length || !rows.length) return null;

    return (
        <div id={comparisonTableAnchorId} ref={ref} className="flex flex-col gap-6">
            <Flex vertical align="center" gap={6} className="px-4 text-center">
                <Typography.Title
                    level={3}
                    className="!mb-0 !text-xl !font-semibold !text-textHeadings sm:!text-2xl"
                >
                    {compareSection.title}
                </Typography.Title>
                <Typography.Text className="text-sm text-textGray">
                    {compareSection.subtitle}
                </Typography.Text>
            </Flex>

            <div className="overflow-x-auto">
                <div className="min-w-[760px] overflow-hidden rounded-2xl border border-borderGray">
                    <table
                        className="w-full"
                        style={{
                            borderCollapse: 'separate',
                            borderSpacing: 0,
                            tableLayout: 'fixed',
                        }}
                    >
                        <colgroup>
                            <col className="w-[34%] xl:w-[28%]" />
                            {columns.map(col => (
                                <col key={col.name} />
                            ))}
                        </colgroup>

                        <thead>
                            <tr>
                                <th className="border-b border-borderGray bg-white px-5 py-5 text-left align-middle sm:px-8">
                                    <Flex align="center" gap={10}>
                                        <AppstoreOutlined className="text-lg text-textHeadings" />
                                        <Typography.Text className="text-base font-medium text-textHeadings">
                                            Service
                                        </Typography.Text>
                                    </Flex>
                                </th>
                                {columns.map(col => (
                                    <th
                                        key={col.name}
                                        className="border-b border-l border-borderGray bg-white px-4 py-5 text-center align-middle font-normal"
                                    >
                                        <Flex vertical align="center" gap={2}>
                                            <Typography.Text className="text-base font-semibold text-textHeadings">
                                                {col.name}
                                            </Typography.Text>
                                            <Typography.Text className="text-xs text-textGray">
                                                {col.price}
                                            </Typography.Text>
                                        </Flex>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {rows.map((feature, rowIdx) => {
                                const isLast = rowIdx === rows.length - 1;
                                const rowBorderB = isLast ? '' : 'border-b border-borderDivider';
                                return (
                                    <tr
                                        key={feature.label}
                                        className={
                                            inView
                                                ? 'animate-fade-in-opacity motion-reduce:animate-none'
                                                : undefined
                                        }
                                        style={
                                            inView
                                                ? {
                                                      animationDelay: `${Math.min(rowIdx, 10) * 45}ms`,
                                                  }
                                                : undefined
                                        }
                                    >
                                        <td className={`${rowBorderB} bg-white px-5 py-4 sm:px-8`}>
                                            <Typography.Text className="text-sm font-medium text-textHeadings">
                                                {feature.label}
                                            </Typography.Text>
                                        </td>
                                        {feature.cells.map((cell, colIdx) => (
                                            <td
                                                key={columns[colIdx].name}
                                                className={`${rowBorderB} border-l border-borderDivider bg-white px-4 py-4 text-center align-middle`}
                                            >
                                                <Cell cell={cell} />
                                            </td>
                                        ))}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
            <Typography.Text className="px-4 text-center text-xs text-textGray">
                All prices are exclusive of GST.
            </Typography.Text>
        </div>
    );
};

export default FeatureComparisonTable;
