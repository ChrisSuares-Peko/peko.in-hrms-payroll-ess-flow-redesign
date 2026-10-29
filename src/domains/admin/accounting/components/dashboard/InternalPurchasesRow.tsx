import { useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { Col, Flex, Typography } from 'antd';

import KpiCard from './KpiCard';
import { faqHint } from '../../faq/FaqHint';
import { AccountingKpi, INTERNAL_ROW_NOTE, INTERNAL_ROW_TITLE } from '../../utils/dashboardData';

type InternalPurchasesRowProps = {
    kpis: AccountingKpi[];
};

const InternalPurchasesRow = ({ kpis }: InternalPurchasesRowProps) => {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Col span={24}>
                <Flex vertical gap={4}>
                    <button
                        type="button"
                        className="w-fit text-left bg-transparent border-0 p-0 cursor-pointer"
                        onClick={() => setOpen(prev => !prev)}
                        aria-expanded={open}
                    >
                        <Flex align="center" gap={8}>
                            <DownOutlined
                                className={`text-[11px] text-textBody transition-transform ${
                                    open ? 'rotate-180' : ''
                                }`}
                            />
                            <Typography.Text className="text-base font-medium">
                                {INTERNAL_ROW_TITLE}
                            </Typography.Text>
                        </Flex>
                    </button>
                    {open && (
                        <Typography.Text className="text-[13px] text-textBody">
                            {INTERNAL_ROW_NOTE}
                        </Typography.Text>
                    )}
                </Flex>
            </Col>
            {open &&
                kpis.map(kpi => (
                    <Col key={kpi.key} xs={24} sm={12} xl={8}>
                        <KpiCard
                            title={kpi.title}
                            value={kpi.value}
                            icon={kpi.icon}
                            tone={kpi.tone}
                            to={kpi.to}
                            help={faqHint('Dashboard', 'Internal Purchases', kpi.title)}
                        />
                    </Col>
                ))}
        </>
    );
};

export default InternalPurchasesRow;
