import { FC } from 'react';

import { FormValuesMap } from './useFormValues';
import { IForm, ISection } from '../../../types/forms';

export interface CustomSectionRenderProps {
    section: ISection;
    config: Record<string, unknown>;
    form: IForm;
    instancePath: string;
}

export interface CustomSectionEntry {
    key: string;
    Render: FC<CustomSectionRenderProps>;
    // How a repeater-enabled custom section is laid out:
    //  - 'summary' (default): standard RepeatableSection (summary rows + per-item
    //    modal that mounts `Render` for one instance) with `RepeaterFooter` below.
    //  - 'inline': `Render` is mounted once and lays out every instance itself.
    repeaterDisplay?: 'summary' | 'inline';
    // Always-mounted footer for a repeater-enabled custom section — hosts
    // cross-instance aggregates/sentinels. Receives instancePath `…{sectionId}.0`.
    RepeaterFooter?: FC<CustomSectionRenderProps>;
    fields?: Array<{
        name: string;
        label: string;
        type: string;
        default_value?: string;
        options?: { label: string; value: string }[];
        required?: boolean;
        hidden?: boolean;
        conditional?: { field: string; operator: string; value: string };
    }>;
    finalize?: (args: {
        values: FormValuesMap;
        config: Record<string, unknown>;
        fields: Array<{ field: string; name: string; value: unknown }>;
        form: IForm;
        section: ISection;
    }) => Promise<void> | void;
}
