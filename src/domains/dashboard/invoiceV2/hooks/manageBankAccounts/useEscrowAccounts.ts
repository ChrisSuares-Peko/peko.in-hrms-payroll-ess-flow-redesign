import { useEffect, useState } from 'react';

import { EscrowAccount } from '../../types/ManageBankAccounts';

const useEscrowAccounts = () => {
    const [accounts, setAccounts] = useState<EscrowAccount[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchData = () => {
        setIsLoading(true);
        // TODO: replace with real API call
        setTimeout(() => {
            setAccounts([]);
            setIsLoading(false);
        }, 0);
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { accounts, isLoading, fetchData };
};

export default useEscrowAccounts;
