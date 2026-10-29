import { Flex, Typography } from 'antd';
import { Link } from 'react-router-dom';

import UpgradePlanButton from '@components/molecular/upgradePlanButton';
import { UserRole } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

const { Text } = Typography;

const PekoUpgradePlanAdaptive = () => {
    const { user } = useAppSelector(state => state.reducer.user);
    const { role, roleName } = useAppSelector(state => state.reducer.auth);

    if (role !== UserRole.CORPORATE || roleName === 'corporate sub user') {
        return null;
    }

    const currentPlanName = user?.activeGroupPackageName || 'Free';
    const showUpgrade = !user?.isTopPlan;

    return (
        <Flex
            align="center"
            justify="space-between"
            gap={12}
            className="w-full px-4 py-4 mb-4 border border-solid rounded-2xl border-black/10"
        >
            <Link to={paths.dashboard.plans}>
                <Text className="font-medium">
                    Current Plan : <span className="font-normal">{currentPlanName}</span>
                </Text>
            </Link>
            {showUpgrade && <UpgradePlanButton />}
        </Flex>
    );
};

export default PekoUpgradePlanAdaptive;
