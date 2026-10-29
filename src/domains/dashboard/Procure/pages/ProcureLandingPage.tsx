import React from 'react';

import { Button, Typography } from 'antd';
import { Navigate, useNavigate } from 'react-router-dom';

import { paths } from '@src/routes/paths';

import imgRegistrationPaper from '../assets/images/compareProposals3d.png';
import imgFileDocument from '../assets/images/payInvoice3d.png';
import imgBriefcase from '../assets/images/purchaseOrders3d.png';
import imgPurchaseRequest from '../assets/images/purchaseRequest3d.png';
import imgRfqVendors from '../assets/images/rfqVendors3d.png';

const { Title, Text } = Typography;

interface FeatureCard {
    title: string;
    description: string;
    image: string;
    imagePosition: { left: number; top: number };
    imageContainerSize: { width: number; height: number };
    // when set, image is rendered larger than container and cropped (Figma overflow-hidden trick)
    imageInnerScale?: number;
    // rotation applied to inner image wrapper
    imageRotate?: number;
}

const featureCards: FeatureCard[] = [
    {
        title: 'Raise Purchase Requests',
        description:
            'Log procurement needs on behalf of your team. Track budgets, categories, and timelines before a single rupee is spent.',
        image: imgPurchaseRequest,
        imageContainerSize: { width: 66, height: 66 },
        imagePosition: { left: 128, top: 125 },
    },
    {
        title: 'Send RFQs to Vendors',
        description:
            'Invite vendors to submit competitive quotes with a single click. Each vendor gets a unique secure link — no login required.',
        image: imgRfqVendors,
        imageContainerSize: { width: 72, height: 72 },
        imagePosition: { left: 123, top: 121 },
    },
    {
        title: 'Compare Proposals',
        description:
            'Review all vendor proposals side by side. Compare pricing, payment terms, and validity. Accept the best one instantly.',
        image: imgRegistrationPaper,
        imageContainerSize: { width: 68, height: 68 },
        imagePosition: { left: 126, top: 127 },
    },
    {
        title: 'Issue Purchase Orders',
        description:
            'Generate a Purchase Order from an accepted proposal in one click. Send it to your vendor via email with full details.',
        image: imgBriefcase,
        imageContainerSize: { width: 78, height: 74 },
        imagePosition: { left: 120, top: 120 },
        imageInnerScale: 1.2,
    },
    {
        title: 'Pay the Invoice',
        description:
            'Receive the vendor invoice against your PO and make the payment directly from Peko — no manual steps outside the platform.',
        image: imgFileDocument,
        imageContainerSize: { width: 74, height: 59 },
        imagePosition: { left: 121, top: 117 },
        imageRotate: 7.27,
    },
];

const PROCURE_VISITED_KEY = 'procure_visited';

const ProcureLandingPage: React.FC = () => {
    const navigate = useNavigate();

    const dashboardPath = `${paths.dashboard.procure}/${paths.procure.dashboard}`;

    if (localStorage.getItem(PROCURE_VISITED_KEY)) {
        return <Navigate to={dashboardPath} replace />;
    }

    const handleContinue = () => {
        localStorage.setItem(PROCURE_VISITED_KEY, '1');
        navigate(dashboardPath);
    };

    return (
        <div className="min-h-screen bg-white flex flex-col items-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8 gap-9">
            {/* Hero */}
            <div className="max-w-[759px] w-full text-center flex flex-col gap-3">
                <Title
                    style={{
                        fontSize: 'clamp(22px, 4vw, 36px)',
                        fontWeight: 700,
                        color: '#1e293b',
                        lineHeight: '52px',
                        margin: 0,
                        fontFamily: 'Roboto, sans-serif',
                        fontVariationSettings: "'wdth' 100",
                    }}
                >
                    Procure — Simple, Smart, and Fully Trackable
                </Title>
                <Text
                    style={{
                        fontSize: 16,
                        color: '#475569',
                        lineHeight: '32px',
                        fontFamily: 'Roboto, sans-serif',
                        fontVariationSettings: "'wdth' 100",
                        display: 'block',
                        textAlign: 'center',
                    }}
                >
                    Manage your entire procurement lifecycle in one place — from purchase requests to invoice payouts.
                </Text>
            </div>

            {/* Feature Cards — 5 in a row, flex-wrap for smaller screens */}
            <div className="flex flex-wrap justify-center gap-4 xl:flex-nowrap">
                {featureCards.map((card) => (
                    <div
                        key={card.title}
                        className="relative overflow-hidden rounded-[24px] shrink-0"
                        style={{ backgroundColor: '#fff9f9', width: 210, height: 200 }}
                    >
                        <div className="absolute flex flex-col gap-[5px]" style={{ top: 18, left: 14, width: 'calc(100% - 28px)' }}>
                            <p
                                style={{
                                    fontSize: 16,
                                    fontWeight: 500,
                                    color: '#000000',
                                    lineHeight: '22px',
                                    margin: 0,
                                    fontFamily: 'Roboto, sans-serif',
                                    fontVariationSettings: "'wdth' 100",
                                }}
                            >
                                {card.title}
                            </p>
                            <p
                                style={{
                                    fontSize: 11,
                                    color: '#475569',
                                    lineHeight: '17px',
                                    margin: 0,
                                    fontFamily: 'Roboto, sans-serif',
                                    fontVariationSettings: "'wdth' 100",
                                }}
                            >
                                {card.description}
                            </p>
                        </div>
                        <div
                            className="absolute overflow-hidden"
                            style={{
                                left: card.imagePosition.left,
                                top: card.imagePosition.top,
                                width: card.imageContainerSize.width,
                                height: card.imageContainerSize.height,
                            }}
                        >
                            <div
                                style={{
                                    transform: card.imageRotate ? `rotate(${card.imageRotate}deg)` : undefined,
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <img
                                    src={card.image}
                                    alt={card.title}
                                    style={{
                                        width: card.imageInnerScale ? `${card.imageInnerScale * 100}%` : '100%',
                                        height: card.imageInnerScale ? `${card.imageInnerScale * 100}%` : '100%',
                                        objectFit: 'contain',
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Body text */}
            <div className="w-full max-w-[1145px] text-center px-2">
                <Text
                    style={{
                        fontSize: 16,
                        color: '#475569',
                        lineHeight: '1.5',
                        fontFamily: 'Roboto, sans-serif',
                        fontVariationSettings: "'wdth' 100",
                    }}
                >
                   Procure brings your entire purchasing process online — raise requests, collect quotes, compare vendors, and issue purchase orders, all from one platform. Stay in complete control of every spend decision with a transparent audit trail from initial request through to final invoice payout.
                </Text>
            </div>

            {/* CTA */}
            <div className="w-full max-w-[977px] flex flex-col items-center gap-4">
                <Title
                    level={2}
                    style={{
                        fontSize: 20,
                        fontWeight: 600,
                        color: '#1e293b',
                        margin: 0,
                        lineHeight: '28px',
                        textAlign: 'center',
                        fontFamily: 'Roboto, sans-serif',
                        fontVariationSettings: "'wdth' 100",
                    }}
                >
                    Spend smarter. Procure faster.
                </Title>
                <Button
                    type="primary"
                    onClick={handleContinue}
                    style={{
                        backgroundColor: '#ff4f4f',
                        borderColor: '#ff4f4f',
                        height: 48,
                        paddingInline: 22,
                        fontSize: 16,
                        fontWeight: 500,
                        lineHeight: '16px',
                        borderRadius: 8,
                        fontVariationSettings: "'wdth' 100",
                    }}
                >
                    Continue to Procure
                </Button>
            </div>
        </div>
    );
};

export default ProcureLandingPage;
