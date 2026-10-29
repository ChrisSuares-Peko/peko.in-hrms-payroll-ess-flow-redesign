import React from 'react';

import { Flex, Spin } from 'antd';
import { Content } from 'antd/es/layout/layout';

import EInvoiceInfoPanel from '../components/eInvoiceSign/EInvoiceInfoPanel';
import SignInCard from '../components/eInvoiceSign/SignInCard';
import { useEInvoiceGuard } from '../hooks/eInvoiceAuth/useEInvoiceGuard';
import { useEInvoiceSignIn } from '../hooks/eInvoiceAuth/useEInvoiceSignIn';

const EInvoicingSign: React.FC = () => {
    const { isChecking } = useEInvoiceGuard(false);
    const { signIn, isLoading } = useEInvoiceSignIn();

    if (isChecking)
        return (
            <Flex align="center" justify="center" className="w-full h-64">
                <Spin size="large" />
            </Flex>
        );

    return (
        <Content className="px-0">
            <Flex className="w-full mt-4 md:mt-8 gap-8 flex-col lg:flex-row lg:items-stretch">
                <Flex className="w-full lg:flex-1 lg:min-w-0">
                    <EInvoiceInfoPanel />
                </Flex>
                <Flex align="center" justify="center" className="w-full lg:flex-1 lg:min-w-0">
                    <SignInCard onSubmit={signIn} isLoading={isLoading} />
                </Flex>
            </Flex>
        </Content>
    );
};

export default EInvoicingSign;
