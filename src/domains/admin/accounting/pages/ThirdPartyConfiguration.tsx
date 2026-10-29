import { Flex } from 'antd';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';

import PageTabs from '@src/domains/dashboard/corporateCards/components/common/PageTabs';
import { paths } from '@src/routes/paths';

import { THIRD_PARTY_CONFIGURATION_TAB_COPY } from '../components/thirdPartyConfiguration/paymentLinkChargeColumns';
import PaymentLinksChargesTab from '../components/thirdPartyConfiguration/PaymentLinksChargesTab';
import { accountingLeafPath } from '../config/servicePaths';
import {
    THIRD_PARTY_CONFIGURATION_TABS,
    ThirdPartyConfigurationTab,
} from '../types/thirdPartyConfiguration';

export { THIRD_PARTY_CONFIGURATION_TAB_COPY };

const TABS = (Object.keys(THIRD_PARTY_CONFIGURATION_TAB_COPY) as ThirdPartyConfigurationTab[]).map(
    key => ({ key, label: THIRD_PARTY_CONFIGURATION_TAB_COPY[key].title })
);

const TAB_PANELS: Record<ThirdPartyConfigurationTab, () => JSX.Element> = {
    'payment-links': PaymentLinksChargesTab,
};

const ThirdPartyConfiguration = () => {
    const { tab } = useParams();
    const navigate = useNavigate();
    const { search } = useLocation();
    const base = accountingLeafPath(paths.accountingAdmin.thirdPartyConfiguration);
    const active = TABS.find(item => item.key === tab)?.key;

    if (!active) {
        return (
            <Navigate
                to={`${base}/${THIRD_PARTY_CONFIGURATION_TABS.paymentLinks}${search}`}
                replace
            />
        );
    }

    const Panel = TAB_PANELS[active];

    return (
        <Flex vertical gap={16}>
            <PageTabs
                tabs={TABS}
                activeKey={active}
                onChange={key => navigate(`${base}/${key}${search}`)}
            />
            <Panel />
        </Flex>
    );
};

export default ThirdPartyConfiguration;
