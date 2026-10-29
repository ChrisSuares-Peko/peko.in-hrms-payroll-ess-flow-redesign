import { CloseCircleOutlined } from '@ant-design/icons';

import pineLabs from '../../assets/pinelabs.png';

export const ROUNDED_MODAL_CLASSNAMES = { content: '!rounded-3xl' };

/** Shared close icon for all Corporate Cards modals. */
export const MODAL_CLOSE_ICON = <CloseCircleOutlined className="text-base text-textHeadings" />;

/** Pine Labs logo footer — add at the bottom of every admin modal/drawer. */
export const PineLabsFooter = () => (
    <div className="flex flex-col items-center justify-center gap-1 pt-2">
        <span className="text-xs text-textGreyLight">Issued by</span>
        <img src={pineLabs} alt="Pine Labs" className="h-5" />
    </div>
);
