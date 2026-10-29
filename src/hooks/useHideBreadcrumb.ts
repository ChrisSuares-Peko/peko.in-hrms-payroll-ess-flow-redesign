import { useLayoutEffect } from 'react';

/**
 * Hides the layout-rendered breadcrumb (`#custom-breadcrumb`, see CustomBreadcrumb)
 * for the lifetime of the calling page and restores it on unmount — so a page can
 * opt out of the default breadcrumb without route lists in the shared component.
 */
const useHideBreadcrumb = () => {
    useLayoutEffect(() => {
        const breadcrumb = document.getElementById('custom-breadcrumb');
        if (!breadcrumb) return undefined;
        const previousDisplay = breadcrumb.style.display;
        breadcrumb.style.display = 'none';
        return () => {
            breadcrumb.style.display = previousDisplay;
        };
    }, []);
};

export default useHideBreadcrumb;
