import { useEffect, useRef } from 'react';

import { Flex } from 'antd';

import { SessionExpiredCard } from '@components/sessionExpired';
import { handleLogout } from '@src/services/handleLogout';
import { SESSION_EXPIRED_REDIRECT_DELAY_MS } from '@utils/sessionExpiredCopy';

const SessionExpired = () => {
    const hasFiredRef = useRef(false);

    useEffect(() => {
        if (hasFiredRef.current) return undefined;
        const timer = setTimeout(() => {
            hasFiredRef.current = true;
            handleLogout();
        }, SESSION_EXPIRED_REDIRECT_DELAY_MS);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Flex
            align="center"
            justify="center"
            className="w-full min-h-[60vh] md:min-h-[70vh] px-4"
        >
            <SessionExpiredCard />
        </Flex>
    );
};

export default SessionExpired;
