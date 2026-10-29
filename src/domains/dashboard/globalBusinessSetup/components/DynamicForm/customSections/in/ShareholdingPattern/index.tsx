import ShareholderInstanceForm from './ShareholderInstanceForm';
import ShareholdingList from './ShareholdingList';
import { CustomSectionRenderProps } from '../../types';

/**
 * Custom section: the shareholding pattern step. Router between the two modes.
 *
 * With the builder repeater enabled, the standard repeater UX owns the list
 * (summary rows + item modal) and this renders one shareholder's form per
 * instance; cross-instance aggregates live in ShareholdingSummary (the
 * registered RepeaterFooter). Without a repeater, the component self-manages
 * the whole shareholder list (ShareholdingList).
 */
export default function ShareholdingPattern(props: CustomSectionRenderProps) {
    const { section } = props;
    if (section.repeater?.enabled) {
        return <ShareholderInstanceForm {...props} />;
    }

    return <ShareholdingList {...props} />;
}
