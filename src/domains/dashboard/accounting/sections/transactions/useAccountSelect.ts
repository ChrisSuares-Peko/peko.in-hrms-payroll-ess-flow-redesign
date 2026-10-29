import { useEffect, useState } from 'react';

export const useAccountSelect = (
    serverAccount: string,
    onChangeAccount: (account: string) => Promise<boolean>
) => {
    const [account, setAccount] = useState(serverAccount);
    useEffect(() => setAccount(serverAccount), [serverAccount]);

    const handleAccountChange = async (value: string) => {
        setAccount(value);
        const ok = await onChangeAccount(value);
        if (!ok) setAccount(serverAccount);
    };

    return { account, handleAccountChange };
};
