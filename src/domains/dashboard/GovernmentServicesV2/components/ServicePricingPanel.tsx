import { Button, Divider, Flex, Skeleton, Typography } from 'antd';

import { formatNumberWithLocalString } from '@utils/priceFormat';

import { VendorServiceDetail } from '../apis';

const { Text } = Typography;

interface ServicePricingPanelProps {
    variants: VendorServiceDetail[];
    selectedVariantId: number | null;
    onSelectVariant: (id: number) => void;
    selectedVariant: VendorServiceDetail | null;
    isPricingLoading: boolean;
    pekoFee: number;
    govFee: number;
    totalAmount: number;
    isApplying: boolean;
    isProceeding: boolean;
    onContinue: () => void;
}

// ServiceDetail's right column: variant picker, "what's included", and the payment breakdown +
// Continue button that hands off to the shared payment page (see useGovtServicePayment).
const ServicePricingPanel = ({
    variants,
    selectedVariantId,
    onSelectVariant,
    selectedVariant,
    isPricingLoading,
    pekoFee,
    govFee,
    totalAmount,
    isApplying,
    isProceeding,
    onContinue,
}: ServicePricingPanelProps) => (
    <Flex
        vertical
        gap={16}
        className="px-4 py-6 rounded-lg"
        style={{ border: '1px solid #F0F0F0' }}
    >
        <Text strong className="text-base">
            Confirm the plan and pricing before you proceed to pay
        </Text>

        <Flex vertical gap={16}>
            {variants.length > 0 && (
                <Flex vertical gap={12}>
                    {variants.map(variant => (
                        <div
                            key={variant.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onSelectVariant(variant.id)}
                            onKeyDown={e => e.key === 'Enter' && onSelectVariant(variant.id)}
                            className="rounded-lg px-4 py-3 cursor-pointer transition-colors"
                            style={{
                                border: `1px solid ${selectedVariantId === variant.id ? '#FF3A3A' : '#e4e7ec'}`,
                            }}
                        >
                            <Flex justify="space-between" align="center">
                                <Text className="text-sm font-medium">{variant.variant_name}</Text>
                                <Text className="text-sm font-medium">
                                    ₹ {formatNumberWithLocalString(variant.price)}
                                </Text>
                            </Flex>
                        </div>
                    ))}
                </Flex>
            )}

            {selectedVariant?.description && (
                <Text className="text-sm" style={{ color: '#475569' }}>
                    {selectedVariant.description}
                </Text>
            )}

            {selectedVariant?.about && (
                <Flex
                    vertical
                    gap={12}
                    className="p-5 rounded-lg"
                    style={{ background: '#F8FAFC', border: '0.5px solid rgba(204,204,204,0.8)' }}
                >
                    <Text className="text-xs font-semibold" style={{ color: '#101828' }}>
                        What&apos;s included
                    </Text>
                    {Array.from(
                        new Set(
                            selectedVariant.about
                                .split(/\r?\n/)
                                .map(line => line.replace(/^[*-]\s*/, '').trim())
                                .filter(Boolean)
                        )
                    ).map(line => (
                        <Flex key={line} gap={8} align="flex-start">
                            <span
                                className="rounded-full flex-shrink-0"
                                style={{ width: 5, height: 5, marginTop: 7, background: '#FF3A3A' }}
                            />
                            <Text className="text-sm" style={{ color: '#475569' }}>
                                {line}
                            </Text>
                        </Flex>
                    ))}
                </Flex>
            )}
        </Flex>

        <Divider style={{ margin: '4px 0' }} />

        {isPricingLoading ? (
            <Skeleton active paragraph={{ rows: 4 }} title={false} />
        ) : (
            <Flex vertical gap={16}>
                <Text strong className="text-base" style={{ color: '#101828' }}>
                    Payment Breakdown
                </Text>
                <Flex vertical gap={12}>
                    <Flex justify="space-between">
                        <Text className="text-sm" style={{ color: '#64748b' }}>
                            Price
                        </Text>
                        <Text className="text-sm font-medium">
                            ₹ {formatNumberWithLocalString(pekoFee)}
                        </Text>
                    </Flex>
                    {govFee > 0 && (
                        <Flex justify="space-between">
                            <Text className="text-sm" style={{ color: '#64748b' }}>
                                Government Fee
                            </Text>
                            <Text className="text-sm font-medium">
                                ₹ {formatNumberWithLocalString(govFee)}
                            </Text>
                        </Flex>
                    )}
                </Flex>
                <Divider style={{ margin: '4px 0' }} />
                <Flex justify="space-between">
                    <Text strong className="text-base" style={{ color: '#101828' }}>
                        Total
                    </Text>
                    <Text strong className="text-base" style={{ color: '#FF3A3A' }}>
                        ₹ {formatNumberWithLocalString(totalAmount)}
                    </Text>
                </Flex>
            </Flex>
        )}

        <Button
            type="primary"
            danger
            size="large"
            block
            loading={isApplying || isProceeding}
            disabled={isPricingLoading}
            onClick={onContinue}
        >
            Continue
        </Button>
    </Flex>
);

export default ServicePricingPanel;
