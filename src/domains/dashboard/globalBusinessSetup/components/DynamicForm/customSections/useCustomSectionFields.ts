import { getIn, useFormikContext } from 'formik';

import { ISection } from '../../../types/forms';

export function useCustomSectionFields(section: ISection, instancePath: string) {
    const { values, errors, setFieldValue } = useFormikContext<any>();

    const get = (name: string) => getIn(values, `${instancePath}.${name}`);

    const set = (name: string, value: unknown) => setFieldValue(`${instancePath}.${name}`, value);

    const error = (name: string): string | undefined => {
        const err = getIn(errors, `${instancePath}.${name}`);
        return typeof err === 'string' ? err : undefined;
    };

    return { get, set, error };
}
