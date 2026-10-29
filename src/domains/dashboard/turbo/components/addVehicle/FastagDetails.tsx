import { Button, Flex, Typography } from 'antd';

import { findInfoValue } from './fastagHelpers';

const FastagDetails = ({
    billData,
    verifyRcResponse,
    providerLabel,
    onChangeProvider,
    onRecharge,
    rechargeLoading,
}: any) => {
    const info = billData?.additionalInfo?.info;
    const infoArr: any[] = ([] as any[]).concat(info ?? []);

    const balanceRaw = findInfoValue(infoArr, [
        'wallet balance',
        'available balance',
        'current balance',
        'balance',
    ]);
    const balance =
        balanceRaw != null && balanceRaw !== ''
            ? `₹ ${Number(balanceRaw).toLocaleString('en-IN', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
              })}`
            : 'N/A';

    const details = [
        { label: 'Current Balance', value: balance },
        {
            label: 'Tag ID',
            value: findInfoValue(infoArr, ['tag id', 'tagid', 'tag number', 'tag no']) || 'N/A',
        },
        {
            label: 'Linked Bank',
            value: findInfoValue(infoArr, ['linked bank', 'bank name', 'bank']) || 'N/A',
        },
        {
            label: 'Last Recharge',
            value:
                findInfoValue(infoArr, ['last recharge', 'recharge date', 'last recharged']) ||
                'N/A',
        },
        {
            label: 'Service Provider',
            value: providerLabel || verifyRcResponse?.fastagProvider || 'N/A',
        },
    ];

    return (
        <Flex
            justify="space-between"
            align="center"
            className="flex-wrap w-full mt-4 gap-x-6 gap-y-4"
        >
            {details.map((item, index) => (
                <Flex key={index} vertical gap={5} className="shrink-0">
                    <Typography.Text type="secondary" className="text-xs">
                        {item.label}
                    </Typography.Text>
                    <Typography.Text className="text-base font-medium whitespace-nowrap">
                        {item.value}
                    </Typography.Text>
                </Flex>
            ))}
            <Flex
                vertical
                gap={12}
                justify="center"
                className="items-stretch shrink-0 min-w-[150px]"
            >
                <Button type="link" danger className="px-0 self-center" onClick={onChangeProvider}>
                    Change Provider
                </Button>
                <Button type="primary" danger onClick={onRecharge} loading={rechargeLoading}>
                    Recharge
                </Button>
            </Flex>
        </Flex>
    );
};

export default FastagDetails;
