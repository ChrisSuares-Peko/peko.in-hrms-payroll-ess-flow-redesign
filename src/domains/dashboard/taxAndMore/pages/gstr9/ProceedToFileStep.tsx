import {
    ArrowLeftOutlined,
    ArrowRightOutlined,
    CheckCircleFilled,
    WarningFilled,
} from '@ant-design/icons';
import { Button, Divider, Flex, Typography } from 'antd';

// ─── Sub-components ───────────────────────────────────────────────────────────

const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div>
        <Typography.Text className="text-xs block mb-1" style={{ color: '#94a3b8' }}>
            {label}
        </Typography.Text>
        <Typography.Text className="font-medium text-sm" style={{ color: '#1e293b' }}>
            {value}
        </Typography.Text>
    </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const ProceedToFileStep = ({
    gstin,
    financialYear,
    // isProceeding,
    // onProceed,
    onBack,
    onNext,
}: {
    gstin: string;
    financialYear: string;
    // isProceeding: boolean;
    // onProceed: () => Promise<boolean>;
    onBack: () => void;
    onNext: () => void;
}) => {
    const proceeded = false;

    // GSTR-9 annual return always files for March (03) of the FY end year
    const month = '03';
    const fy = financialYear || '—';

    // const handleProceed = async () => {
    //     const ok = await onProceed();
    //     if (ok) setProceeded(true);
    // };

    return (
        <div className="border mt-2 border-[#e2e8f0] rounded-[14px] overflow-hidden bg-white">
            <Flex vertical gap={16} className="px-5 pt-5 pb-5">
                {/* Title */}
                <div>
                    <Typography.Text
                        className="font-bold text-base block"
                        style={{ color: '#1e293b', fontSize: 16 }}
                    >
                        Proceed to File
                    </Typography.Text>
                    <Typography.Text className="text-sm" style={{ color: '#64748b' }}>
                        Marks the return as ready to be filed.
                    </Typography.Text>
                </div>

                {/* Info row with Proceed button */}
                <Flex
                    align="center"
                    justify="space-between"
                    wrap="wrap"
                    gap={12}
                    className="border border-[#e2e8f0] rounded-xl px-5 py-4"
                    style={{ background: '#f8fafc' }}
                >
                    <Flex gap={40} wrap="wrap">
                        <InfoItem label="GSTIN" value={gstin} />
                        <InfoItem label="Financial Year" value={fy} />
                        <InfoItem label="Month" value={month} />
                    </Flex>
                    {/* <Button
                    type="primary"
                    danger
                    loading={isProceeding}
                    icon={<ArrowRightOutlined />}
                    iconPosition="end"
                    style={{ height: 40 }}
                    disabled={proceeded}
                    onClick={handleProceed}
                >
                    Proceed to File
                </Button> */}
                </Flex>

                {/* Post-proceed alerts */}
                {proceeded && (
                    <>
                        <Flex
                            gap={10}
                            align="flex-start"
                            className="border border-[#bbf7d0] rounded-xl px-4 py-3"
                            style={{ background: '#f0fdf4' }}
                        >
                            <CheckCircleFilled
                                style={{
                                    color: '#16a34a',
                                    fontSize: 16,
                                    marginTop: 1,
                                    flexShrink: 0,
                                }}
                            />
                            <div>
                                <Typography.Text
                                    className="font-semibold text-sm block"
                                    style={{ color: '#15803d' }}
                                >
                                    Draft Saved Successfully
                                </Typography.Text>
                                <Typography.Text className="text-xs" style={{ color: '#15803d' }}>
                                    Proceed was successful. Generate EVC OTP to complete filing.
                                </Typography.Text>
                            </div>
                        </Flex>

                        <Flex
                            gap={10}
                            align="flex-start"
                            className="border border-[#fef3c7] rounded-xl px-4 py-3"
                            style={{ background: '#fffbeb' }}
                        >
                            <WarningFilled
                                style={{
                                    color: '#d97706',
                                    fontSize: 16,
                                    marginTop: 1,
                                    flexShrink: 0,
                                }}
                            />
                            <Typography.Text className="text-sm" style={{ color: '#92400e' }}>
                                Annual return once filed <strong>cannot be revised</strong>. Ensure
                                all tables are correct before proceeding to EVC authentication.
                            </Typography.Text>
                        </Flex>
                    </>
                )}

                {/* Footer */}
                <Divider className="m-0" />
                <Flex justify="space-between" wrap="wrap" gap={8}>
                    <Button icon={<ArrowLeftOutlined />} style={{ height: 40 }} onClick={onBack}>
                        Back
                    </Button>
                    <Button
                        type="primary"
                        danger
                        icon={<ArrowRightOutlined />}
                        iconPosition="end"
                        style={{ height: 40 }}
                        onClick={onNext}
                    >
                        Generate EVC OTP &amp; File
                    </Button>
                </Flex>
            </Flex>
        </div>
    );
};

export default ProceedToFileStep;
