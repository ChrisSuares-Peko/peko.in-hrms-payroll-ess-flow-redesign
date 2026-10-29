import KycLegacy from './KycLegacy';
import KycRepeaterView from './KycRepeaterView';
import { CustomSectionRenderProps } from '../../types';

/**
 * Custom section: KYC document upload step for director/partner and registered
 * office documents.
 *
 * With the builder repeater enabled (field_value source picked by the admin),
 * the section renders inline — one director block per instance plus the
 * one-time documents (registered office, name approval). Sections saved before
 * repeater support keep the legacy numbered-fields layout.
 */
export default function KycDocuments(props: CustomSectionRenderProps) {
    const { section } = props;
    if (section.repeater?.enabled) {
        return <KycRepeaterView {...props} />;
    }

    return <KycLegacy {...props} />;
}
