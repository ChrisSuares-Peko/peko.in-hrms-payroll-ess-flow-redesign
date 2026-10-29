import { Flex } from 'antd';

import dSvg from '../assets/svg/d.svg';
import mSvg from '../assets/svg/m.svg';
import ooSvg from '../assets/svg/oo.svg';
import rSvg from '../assets/svg/r.svg';

interface Props {
    // Height of the tall 'd' glyph in px; the x-height letters scale to match.
    height?: number;
}

// "droom" wordmark composed from per-letter SVGs (d r oo m). The 'd' has an ascender
// (natural 20×34); r/oo/m are x-height (×20). We scale the short letters by 20/34 and
// bottom-align so they share a baseline.
const DroomLogo = ({ height = 26 }: Props) => {
    const xHeight = Math.round((height * 20) / 34);
    return (
        <Flex align="end" gap={2}>
            <img src={dSvg} alt="" style={{ height }} />
            <img src={rSvg} alt="" style={{ height: xHeight }} />
            <img src={ooSvg} alt="" style={{ height: xHeight }} />
            <img src={mSvg} alt="" style={{ height: xHeight }} />
        </Flex>
    );
};

export default DroomLogo;
