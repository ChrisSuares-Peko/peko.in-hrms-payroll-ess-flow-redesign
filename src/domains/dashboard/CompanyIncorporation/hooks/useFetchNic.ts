import { useEffect, useState } from 'react';

import { useAppSelector } from '@src/hooks/store';

import { getNIc } from '../api';

type NicItem = { code: string; description: string };

export const useNIC = (parent?: string) => {
    const [data, setData] = useState<NicItem[]>([]);
    const [loading, setLoading] = useState(false);

    const { id: userId, role: userType } = useAppSelector(state => state.reducer.auth);

    useEffect(() => {
        // Child dropdowns pass parent='' before the parent level is selected — skip
        // these to avoid redundant calls that return the master list.
        if (parent === '') {
            setData([]);
            setLoading(false);
            return () => {};
        }

        let cancelled = false;
        setLoading(true);
        setData([]); // clear stale options immediately on parent change

        getNIc({ userId, userType, parent })
            .then((response: NicItem[] | false) => {
                if (!cancelled) setData(response || []);
            })
            .catch(err => {
                if (!cancelled) console.error('NIC fetch error', err);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [parent, userId, userType]);

    return { data, loading };
};
