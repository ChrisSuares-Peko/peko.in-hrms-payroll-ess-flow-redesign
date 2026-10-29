import { useEffect, useState } from 'react';

import { fetchStateOptions } from '../api/index';

export default function useStateOptions() {
    const [stateOptions, setStateOptions] = useState<{ label: string; value: string }[]>([]);

    useEffect(() => {
        fetchStateOptions().then(data => {
            if (data) setStateOptions(data);
        });
    }, []);

    return { stateOptions };
}
