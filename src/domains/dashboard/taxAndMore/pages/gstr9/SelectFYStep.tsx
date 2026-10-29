import {
    ArrowRightOutlined,
    ExclamationCircleOutlined,
    InfoCircleOutlined,
} from '@ant-design/icons';
import { Button, Divider, Flex, Skeleton, Typography } from 'antd';

import { Gstr9FilingsByYear } from '../../api';
import calendarIcon from '../../assets/icons/calendar.svg';
import { Gstr9DraftData } from '../../types';
import { FINANCIAL_YEARS } from '../../utils/data';

const WarningBox = ({ children }: { children: React.ReactNode }) => (
    <Flex
        gap={12}
        align="flex-start"
        className="border rounded-xl px-4 py-3"
        style={{ backgroundColor: '#fffbeb', borderColor: '#fde68a' }}
    >
        <ExclamationCircleOutlined
            style={{ color: '#F59E0B', fontSize: 14, marginTop: 2, flexShrink: 0 }}
        />
        <div>{children}</div>
    </Flex>
);

const SuccessBox = ({ children }: { children: React.ReactNode }) => (
    <Flex
        gap={12}
        align="flex-start"
        className="border rounded-xl px-4 py-3"
        style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}
    >
        <InfoCircleOutlined
            style={{ color: '#43B75D', fontSize: 14, marginTop: 2, flexShrink: 0 }}
        />
        <div>{children}</div>
    </Flex>
);

const InfoBox = ({ children }: { children: React.ReactNode }) => (
    <Flex
        gap={12}
        align="flex-start"
        className="border rounded-xl px-4 py-3"
        style={{ backgroundColor: '#f8fafc', borderColor: '#e2e8f0' }}
    >
        <InfoCircleOutlined
            style={{ color: '#64748b', fontSize: 14, marginTop: 2, flexShrink: 0 }}
        />
        <div>{children}</div>
    </Flex>
);

const SelectFYStep = ({
    selectedFY,
    isFetching,
    isFetchingFilingStatus,
    draftData,
    filingStatus,
    onFYChange,
    onFetch,
    onProceed,
}: {
    selectedFY: string;
    isFetching: boolean;
    isFetchingFilingStatus: boolean;
    draftData: Gstr9DraftData | null;
    filingStatus: Gstr9FilingsByYear | null;
    onFYChange: (fy: string) => void;
    onFetch: () => void;
    onProceed: () => void;
}) => {
    const isAlreadyFiled = filingStatus?.[selectedFY]?.filed === true;

    if (isFetchingFilingStatus) {
        return (
            <div className="bg-white border border-[#e2e8f0] rounded-[14px] mt-2 overflow-hidden px-6 py-6">
                <Skeleton.Input active block style={{ height: 28, width: 200, marginBottom: 24 }} />
                <Flex align="flex-end" justify="space-between" gap={16} className="mb-6">
                    <div style={{ flex: 1 }}>
                        <Skeleton.Input
                            active
                            block
                            style={{ height: 16, width: 120, marginBottom: 12 }}
                        />
                        <Flex gap={8}>
                            <Skeleton.Button
                                active
                                style={{ width: 88, height: 38, borderRadius: 8 }}
                            />
                            <Skeleton.Button
                                active
                                style={{ width: 88, height: 38, borderRadius: 8 }}
                            />
                        </Flex>
                    </div>
                    <Skeleton.Button active style={{ width: 240, height: 40, borderRadius: 8 }} />
                </Flex>
                <Skeleton.Input active block style={{ height: 52, borderRadius: 12 }} />
            </div>
        );
    }

    return (
        <Flex
            vertical
            gap={0}
            className="bg-white border border-[#e2e8f0] rounded-[14px] mt-2 overflow-hidden"
        >
            <Flex vertical gap={20} className="px-6 pt-6 pb-4">
                <Typography.Text className="font-medium text-xl" style={{ color: '#1e293b' }}>
                    Select Financial Year
                </Typography.Text>

                <Flex align="flex-end" justify="space-between" gap={16} wrap="wrap">
                    <div>
                        <Flex align="center" gap={6} className="mb-2">
                            <img src={calendarIcon} alt="" style={{ width: 16, height: 16 }} />
                            <Typography.Text
                                className="text-sm font-medium"
                                style={{ color: '#475569' }}
                            >
                                Financial Year
                            </Typography.Text>
                        </Flex>
                        <Flex className="mt-2" gap={8}>
                            {FINANCIAL_YEARS.map(fyOpt => (
                                <button
                                    key={fyOpt}
                                    type="button"
                                    className="px-5 py-2 rounded-lg border text-sm font-medium transition-colors"
                                    style={{
                                        backgroundColor: selectedFY === fyOpt ? '#ff4f4f' : 'white',
                                        borderColor: selectedFY === fyOpt ? '#ff4f4f' : '#e2e8f0',
                                        color: selectedFY === fyOpt ? '#fff' : '#475569',
                                    }}
                                    onClick={() => onFYChange(fyOpt)}
                                >
                                    {fyOpt}
                                </button>
                            ))}
                        </Flex>
                    </div>
                    <Button
                        type="primary"
                        danger
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        loading={isFetching}
                        disabled={isAlreadyFiled}
                        onClick={onFetch}
                        style={{ height: 40, flexShrink: 0 }}
                    >
                        Fetch GSTR-9 Draft (GET /gstr-9)
                    </Button>
                </Flex>

                {isAlreadyFiled && (
                    <InfoBox>
                        <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                            GSTR-9 for <strong>FY {selectedFY}</strong> has already been filed. No
                            further action is required for this year.
                        </Typography.Text>
                    </InfoBox>
                )}

                {!isAlreadyFiled && !draftData && (
                    <InfoBox>
                        <Typography.Text className="text-sm" style={{ color: '#475569' }}>
                            GSTR-9 once filed <strong>cannot be revised</strong>. Review all values
                            carefully before proceeding.
                        </Typography.Text>
                    </InfoBox>
                )}

                {draftData && (
                    <>
                        {draftData.warnings?.map((w, i) => (
                            <WarningBox key={i}>
                                <Typography.Text
                                    className="font-semibold text-xs"
                                    style={{ color: '#F59E0B' }}
                                >
                                    {w.code} — {w.message}
                                </Typography.Text>
                                {w.detail && (
                                    <Typography.Text
                                        className="text-xs block"
                                        style={{ color: '#F59E0B', marginTop: 2 }}
                                    >
                                        {w.detail}
                                    </Typography.Text>
                                )}
                            </WarningBox>
                        ))}

                        {(draftData.gstr1AllFiled || draftData.portalSessionActive) && (
                            <SuccessBox>
                                <ul
                                    className="list-disc ml-3 my-0 py-0"
                                    style={{ color: '#43B75D' }}
                                >
                                    {draftData.gstr1AllFiled && (
                                        <li>
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#43B75D' }}
                                            >
                                                All GSTR-1 returns filed for FY {selectedFY}.
                                                Auto-population of Table 4 is available.
                                            </Typography.Text>
                                        </li>
                                    )}
                                    {draftData.portalSessionActive && (
                                        <li>
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#43B75D' }}
                                            >
                                                GST Portal session active.
                                                {draftData.aggregateTurnover
                                                    ? ` Aggregate turnover: ₹${draftData.aggregateTurnover.toLocaleString('en-IN')}`
                                                    : ''}
                                            </Typography.Text>
                                        </li>
                                    )}
                                </ul>
                            </SuccessBox>
                        )}

                        {(draftData.infoPoints?.length ?? 0) > 0 && (
                            <InfoBox>
                                <ul
                                    className="list-disc ml-3 my-0 py-0"
                                    style={{ color: '#475569' }}
                                >
                                    {draftData.infoPoints?.map((pt, i) => (
                                        <li key={i}>
                                            <Typography.Text
                                                className="text-sm"
                                                style={{ color: '#475569' }}
                                            >
                                                {pt}
                                            </Typography.Text>
                                        </li>
                                    ))}
                                </ul>
                            </InfoBox>
                        )}
                    </>
                )}
            </Flex>

            <Divider className="m-0 mt-1" />

            <Flex justify="flex-end" className="px-6 py-4">
                <Button
                    type="primary"
                    danger
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    disabled={!draftData}
                    onClick={onProceed}
                    style={{ height: 40, fontWeight: 500 }}
                >
                    Proceed to Auto-Calculated Review
                </Button>
            </Flex>
        </Flex>
    );
};

export default SelectFYStep;
