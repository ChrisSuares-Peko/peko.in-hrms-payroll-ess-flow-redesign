import { Button, Flex, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

import { UserRole } from '@customtypes/general';
import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';
import { formatNumberWithLocalString, formatNumberWithoutCommas } from '@utils/priceFormat';

const { Text } = Typography;

const PekoCreditsAdaptive = () => {
    const navigate = useNavigate();
    const { user } = useAppSelector(state => state.reducer.user);
    const { role, roleName } = useAppSelector(state => state.reducer.auth);

    if (
        role !== UserRole.CORPORATE ||
        roleName === 'corporate sub user' ||
        !user?.isPekoCreditAvailable
    ) {
        return null;
    }

    const isClaim = user?.isPekoCreditActive === false;
    const hasAmount = Number(formatNumberWithoutCommas(user?.pekoCredits ?? 0)) > 0;

    return (
        <Flex
            align="center"
            justify="space-between"
            gap={12}
            className="w-full px-4 py-4 mb-4 border border-solid rounded-2xl border-black/10"
        >
            <Flex vertical>
                <Text className={hasAmount ? 'text-xs' : 'text-base font-medium'}>
                    Peko Credits
                </Text>
                {hasAmount && (
                    <Text className="text-lg font-semibold">
                        ₹ {formatNumberWithLocalString(user?.pekoCredits ?? 0)}
                    </Text>
                )}
            </Flex>
            <Button type="primary" onClick={() => navigate(paths.dashboard.pekoCredit)}>
                {isClaim ? 'Claim your free credits' : 'Use Credits'}
            </Button>
        </Flex>
    );
};

export default PekoCreditsAdaptive;
