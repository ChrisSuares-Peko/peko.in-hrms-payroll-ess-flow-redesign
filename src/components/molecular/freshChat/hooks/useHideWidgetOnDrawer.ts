import { useEffect } from 'react';

const useHideWidgetOnDrawer = (open: boolean) => {
    useEffect(() => {
        if (open && (window as any).fcWidget) {
            (window as any).fcWidget.hide();
        }

        return () => {
            if ((window as any).fcWidget) {
                (window as any).fcWidget.show();
            }
        };
    }, [open]);
};

export default useHideWidgetOnDrawer;
