/* eslint-disable no-nested-ternary */
import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import useGetAddonDetails from '@src/hooks/useSubscriptionAddons';
import { paths } from '@src/routes/paths';
import { accessKeys } from '@utils/accessKeys';
import { packageAccessKeys } from '@utils/packageAccessKeys';

import useGetEmployeeCount from '../../hooks/dashboardHooks/useGetEmployeeCount';

type BannerKind = 'addon-grace' | 'plan-downgraded' | null;

const PayrollAccessBanner = () => {
    const navigate = useNavigate();
    const { count, isLoading: countLoading } = useGetEmployeeCount();
    const {
        addonData,
        purchaseData,
        isLoading: addonLoading,
    } = useGetAddonDetails(accessKeys.payroll, packageAccessKeys.Payroll);

    if (countLoading || addonLoading || !addonData) return null;

    const freeLimit = addonData?.freeBaseLimit ?? 0;
    const addonLimit = addonData?.addonLimit ?? 0;
    const employees = count ?? 0;
    const overFreeLimit = Math.max(0, employees - freeLimit);
    const overEffectiveLimit = employees > freeLimit + addonLimit;
    const addonInGrace = !!purchaseData?.addOns?.isGracePeriod;
    const canPurchaseAddon = addonData?.isAddonPurchaseAllowed === true;

    let kind: BannerKind = null;
    if (addonInGrace && overFreeLimit > 0) kind = 'addon-grace';
    else if (overEffectiveLimit) kind = 'plan-downgraded';

    if (!kind) return null;

    const shortage = Math.max(0, employees - freeLimit - (kind === 'addon-grace' ? 0 : addonLimit));
    const message =
        kind === 'addon-grace'
            ? `Your payroll addon renewal didn't go through. Renew now to keep ${overFreeLimit} employee(s) beyond the free tier (${freeLimit}).`
            : canPurchaseAddon
              ? `Your plan covers ${freeLimit + addonLimit} employees (${freeLimit} free + ${addonLimit} addon) but you have ${employees}. Buy ${shortage} more addons monthly to keep them in payroll.`
              : 'Your team has outgrown your current plan. Upgrade to keep everyone in payroll.';

    const ctaLabel =
        kind === 'addon-grace' ? 'Renew addons' : canPurchaseAddon ? 'Buy addons' : 'View plans';

    return (
        <Flex
            className="bg-[#DB372C] px-5 py-2 gap-5 sm:items-center mb-5 flex-col sm:flex-row w-full rounded"
            align="center"
        >
            <Typography.Text className="text-xs text-white flex-1">{message}</Typography.Text>
            <Button
                size="small"
                className="text-white bg-inherit border-white"
                onClick={() => navigate(`/${paths.plans.index}`)}
            >
                {ctaLabel}
            </Button>
        </Flex>
    );
};

export default PayrollAccessBanner;
