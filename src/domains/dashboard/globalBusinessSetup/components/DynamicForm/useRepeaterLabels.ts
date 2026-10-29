import { useMemo } from 'react';

import { useFormikContext } from 'formik';

import { IForm, IRepeater } from '../../types/forms';

/**
 * Per-instance title labels for a repeater section configured with
 * `label_field_name` — a field in a sibling repeater driven by the same source
 * field. labels[i] is that field's value in the sibling's instance i, so rows
 * can render "Director 2 - John". Returns [] when the section has no label
 * link (titles stay plain). Ported from the vendor's useRepeaterLabels,
 * re-targeted to Peko's numeric-keyed Formik values.
 */
export default function useRepeaterLabels(
    repeater: IRepeater | undefined,
    form: IForm,
    count: number
): (string | undefined)[] {
    const { values } = useFormikContext<any>();

    return useMemo(() => {
        const path = repeater?.label_field_name;

        if (!repeater?.enabled || !path || count <= 0) return [];

        // label_field_name carries the vendor index-path format
        // (pages.N.sections.N[.instances.N].fields.N[.value]).
        const match = path.match(
            /pages\.(\d+)\.sections\.(\d+)\.(?:instances\.\d+\.)?fields\.(\d+)/
        );

        if (!match) return [];

        const page = form.pages?.[Number(match[1])];
        const section = page?.sections?.[Number(match[2])];
        const field = section?.fields?.[Number(match[3])];

        if (!page || !section || !field) return [];

        const sectionVals = values?.pages?.[page._id]?.[section._id];

        return Array.from({ length: count }, (_, i) => {
            const raw = sectionVals?.[i]?.[field.name];
            const label = raw === undefined || raw === null ? '' : String(raw).trim();

            return label || undefined;
        });
    }, [repeater, form, count, values]);
}
