import { useEffect } from 'react';

const useScrollUpOnPageChange = (currentPage: number) => {
    useEffect(() => {
        window.scrollTo(0, 0);
        const myContainer = document.getElementById('myContainer');
        myContainer?.scrollTo(0, 0);
    }, [currentPage]);
};

export default useScrollUpOnPageChange;
