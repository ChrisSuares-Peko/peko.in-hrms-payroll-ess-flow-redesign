import cursor from '../../../assets/requestAccess/cursor.svg';
import { REQUEST_ACCESS_FUNDING_ART as ART } from '../../../utils/membershipData';

const CompanyFundingArt = () => (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-center gap-1 px-4">
        <div className="w-24 -rotate-[0.58deg] rounded-md bg-white p-2 shadow-[1px_2px_16px_1px_rgba(0,0,0,0.05)]">
            <span className="bg-gradient-to-r from-[#2A2A2A] to-textLightRed bg-clip-text text-[0.6rem] font-medium text-transparent">
                {ART.heading}
            </span>
            <div className="mt-4">
                <span className="bg-gradient-to-r from-[#2A2A2A] to-textLightRed bg-clip-text text-[0.5rem] font-medium text-transparent">
                    {ART.amount}
                </span>
                <span className="mt-1 block h-1 w-1/2 rounded-full bg-[#FFD0D0]" />
                <span className="mt-1 block h-1 w-full rounded-full bg-[#FFD0D0]" />
            </div>
        </div>

        <div className="relative mb-10">
            <span className="block rounded-full bg-[#FF7575] px-3 py-1.5 text-[0.6rem] font-semibold text-white shadow-sm">
                {ART.ctaLabel}
            </span>
            <img
                src={cursor}
                alt=""
                aria-hidden
                className="absolute -bottom-3 left-2/3 h-5 w-auto"
            />
        </div>
    </div>
);

export default CompanyFundingArt;
