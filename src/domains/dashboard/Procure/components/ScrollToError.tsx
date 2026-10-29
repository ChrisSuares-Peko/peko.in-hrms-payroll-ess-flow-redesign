import { useEffect } from 'react';

import { useFormikContext } from 'formik';

const ScrollToError: React.FC = () => {
    const { submitCount, isValid } = useFormikContext();

    useEffect(() => {
        if (submitCount > 0 && !isValid) {
            requestAnimationFrame(() => {
                const firstError = document.querySelector(
                    '.ant-form-item-has-error, [data-form-error="true"]'
                );
                if (firstError) {
                    firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            });
        }
    }, [submitCount, isValid]);

    return null;
};

export default ScrollToError;
