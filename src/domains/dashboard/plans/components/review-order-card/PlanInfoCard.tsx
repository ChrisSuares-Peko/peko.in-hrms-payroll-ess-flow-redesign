import React from 'react';

import { capitalize } from 'lodash';

import type { PackageService, SelectedType } from '@domains/dashboard/plans/types';
import { buildDisplayFeatures } from '@domains/dashboard/plans/utils/reviewOrderData';
import { formatNumberWithLocalString } from '@utils/priceFormat';

import FeatureGrid from './FeatureGrid';

type Props = {
    packageName: string;
    selectedType: SelectedType;
    price: string;
    subtitle: string;
    services: PackageService[];
    isMandate?: boolean;
    isOneTime?: boolean;
    whatsAppDescription?: string | null;
};

const PlanInfoCard = ({
    packageName,
    selectedType,
    price,
    subtitle,
    services,
    isMandate,
    isOneTime,
    whatsAppDescription,
}: Props) => {
    const features = buildDisplayFeatures(services, { whatsAppDescription });
    const periodLabel = selectedType === 'monthly' ? 'Month' : 'Year';

    return (
        <div className="w-full bg-white border border-[#e6e9f5] rounded-3xl p-8 xl:p-12 flex flex-col gap-6">
            <div className="border-b border-[#e6e9f5] pb-5 flex flex-col gap-4">
                <div className="flex items-center flex-wrap gap-2">
                    <span className="bg-[#fff7f7] text-[#ff4f4f] font-medium text-sm px-4 py-1.5 rounded-full leading-[20px]">
                        {packageName}
                    </span>
                    <span className="text-[#475569] text-sm font-medium">
                        {capitalize(selectedType)}
                    </span>
                    {isMandate && (
                        <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full border border-blue-100">
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 12 12"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M6 1C3.24 1 1 3.24 1 6s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm.5 7.5h-1v-4h1v4zm0-5h-1V2.5h1V3.5z"
                                    fill="currentColor"
                                />
                            </svg>
                            Auto-renewal via Mandate
                        </span>
                    )}
                </div>

                <div className="flex items-end gap-2">
                    <span className="text-3xl xl:text-4xl font-bold text-[#252430] leading-none">
                        ₹{formatNumberWithLocalString(Number(price))}
                    </span>
                    <span className="text-[#858ba0] text-sm font-medium pb-1">
                        /{periodLabel} + GST
                    </span>
                </div>

                {subtitle && (
                    <p className="text-[#6c6c6c] text-base font-light leading-6">{subtitle}</p>
                )}

                {isMandate && (
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                        <svg
                            className="shrink-0 mt-0.5"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9-1.5v5H7v-5h2zm0-3v2H7v-2h2z"
                                fill="#3b82f6"
                            />
                        </svg>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-blue-700">
                                Mandate / Auto-renewal active
                            </span>
                            <span className="text-xs text-blue-500 leading-relaxed">
                                Your subscription will renew automatically each billing period. You
                                can cancel anytime from Settings.
                            </span>
                        </div>
                    </div>
                )}

                {isOneTime && (
                    <div className="flex items-start gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <svg
                            className="shrink-0 mt-0.5"
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13zM0 8a8 8 0 1 1 16 0A8 8 0 0 1 0 8zm9-1.5v5H7v-5h2zm0-3v2H7v-2h2z"
                                fill="#f59e0b"
                            />
                        </svg>
                        <div className="flex flex-col gap-0.5">
                            <span className="text-sm font-semibold text-amber-700">
                                One-time payment
                            </span>
                            <span className="text-xs text-amber-600 leading-relaxed">
                                This is a one-time payment for one year. It does not auto-renew —
                                you&apos;ll need to repurchase after it ends.
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {features.length > 0 && <FeatureGrid features={features} />}
        </div>
    );
};

export default PlanInfoCard;
