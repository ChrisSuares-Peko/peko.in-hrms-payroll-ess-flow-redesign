/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';

import { debounce } from 'lodash';

// Use a generic type <T> to support any data type
const useDebounce = <T>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    const debouncedFunction = useCallback(
        debounce((newValue: T) => {
            setDebouncedValue(newValue);
        }, delay),
        [delay]
    );

    useEffect(() => {
        debouncedFunction(value);
        return () => {
            debouncedFunction.cancel();
        };
    }, [value, debouncedFunction]);

    return debouncedValue;
};

export default useDebounce;
