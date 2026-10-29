import { useEffect } from 'react';

import { Button, Flex, Typography } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { useNavigate } from 'react-router-dom';

import styles from '@src/components/molecular/subscription/styles.module.css';
import { paths } from '@src/routes/paths';

type Props = {
    children: any;
    subscriptionDetails: {
        isPurchased: boolean;
        previousSubscription: { packageId: string; packageName: string; status?: string } | null;
    };
    shouldBlockActions?: boolean;
};

const RenewalOverlay = ({ children, subscriptionDetails, shouldBlockActions = true }: Props) => {
    const container = document.getElementById('myContainer');
    const footerContainer = document.getElementById('footer-container');
    const breadcrumb = document.getElementById('custom-breadcrumb');

    const navigate = useNavigate();
    const { isPurchased, previousSubscription } = subscriptionDetails;
    const isExpired = !isPurchased && previousSubscription?.status === 'EXPIRED';

    useEffect(() => {
        if (!footerContainer || !container) return () => {};

        if (isExpired) {
            container.classList.remove('sm:pt-8');
            container.classList.add('relative', 'xs:pt-32', 'sm:pt-16');
        }
        return () => {
            if (isExpired) {
                container.classList.remove('relative', 'xs:pt-32', 'sm:pt-16', 'bg-[#f2f2f2]');
                container.classList.add('sm:pt-8');
            }
        };
    }, [isExpired, container, footerContainer, breadcrumb, shouldBlockActions]);

    return (
        <>
            {isExpired && (
                <Flex className="bg-[#F74C4C] px-5 py-2 gap-5 items-center mb-5 absolute left-0 top-0 w-full pt-">
                    <Typography.Text className="text-xs text-white">
                        Your auto-renewal payment could not be processed after multiple attempts.
                        Please complete your payment by clicking &#39;Upgrade&#39; to restore full
                        access to the Peko Commerce service.
                    </Typography.Text>

                    <Button
                        size="small"
                        danger
                        className={`rounded-[4px] hover:bg-none ${styles.removeHoverBg}`}
                        onClick={() => {
                            navigate(`${paths.dashboard.ecommerce}/${paths.ecommerce.plan}`);
                        }}
                    >
                        Upgrade
                    </Button>
                </Flex>
            )}
            <Content className={`${isExpired && shouldBlockActions ? 'pointer-events-none' : ''}`}>
                {children}
            </Content>
        </>
    );
};

export default RenewalOverlay;
