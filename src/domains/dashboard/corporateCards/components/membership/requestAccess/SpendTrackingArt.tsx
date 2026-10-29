import chevronDown from '../../../assets/requestAccess/chevron-down.svg';
import trendUp from '../../../assets/requestAccess/trend-up.svg';
import { REQUEST_ACCESS_TRACKING_ART as ART } from '../../../utils/membershipData';

const SpendTrackingArt = () => (
    <div className="pointer-events-none absolute inset-x-0 bottom-2 flex justify-center px-4">
        <div className="w-full max-w-52 rounded-xl border border-solid border-borderSubtle bg-white p-2.5 shadow-sm">
            <div className="flex items-center justify-between">
                <span className="text-[0.5rem] font-semibold text-textHeadings">{ART.heading}</span>
                <span className="flex items-center gap-1 rounded border border-solid border-borderSubtle px-1 py-0.5">
                    <span className="text-[0.4rem] text-textHeadings">{ART.rangeLabel}</span>
                    <img src={chevronDown} alt="" aria-hidden className="h-1.5 w-1.5" />
                </span>
            </div>

            <div className="mt-1.5 flex items-center gap-1">
                <span className="text-[0.7rem] font-semibold text-textHeadings">{ART.amount}</span>
                <span className="flex items-center gap-0.5 rounded-full bg-success-surface px-1 py-px">
                    <img src={trendUp} alt="" aria-hidden className="h-1 w-1" />
                    <span className="text-[0.35rem] font-semibold text-textHeadings">
                        {ART.deltaLabel}
                    </span>
                </span>
                <span className="truncate text-[0.35rem] text-textGreyLight">{ART.deltaNote}</span>
            </div>

            <div className="relative mt-1.5 h-12">
                <div className="absolute inset-0 flex flex-col justify-between">
                    {ART.gridLines.map(line => (
                        <span key={line} className="flex items-center gap-1">
                            <span className="w-3 text-right text-[0.35rem] text-textGreyLight">
                                {line}
                            </span>
                            <span className="h-px flex-1 bg-borderSubtle" />
                        </span>
                    ))}
                </div>
                <div className="absolute inset-y-0 left-4 right-0 flex items-end justify-between gap-1">
                    {ART.bars.map(bar => (
                        <span
                            key={bar.key}
                            className="w-1.5 rounded-b-sm bg-[#FFE0E0]"
                            style={{ height: `${bar.height}%` }}
                        />
                    ))}
                </div>
            </div>

            <div className="ml-4 mt-1 flex justify-between">
                {ART.bars.map(bar => (
                    <span key={bar.key} className="text-[0.35rem] text-textGreyLight">
                        {bar.label}
                    </span>
                ))}
            </div>
        </div>
    </div>
);

export default SpendTrackingArt;
