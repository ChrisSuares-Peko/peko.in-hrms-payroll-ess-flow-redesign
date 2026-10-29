interface PaymentMethodRowProps {
    label: string;
    icon: string;
    amount?: string;
    brandLogo?: string;
    checked?: boolean;
    disabled?: boolean;
    badge?: string;
    handleSelection: () => void;
}

const getRowStateClasses = (disabled: boolean, checked: boolean) => {
    if (disabled) return 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60';
    if (checked) return 'border-lightRed bg-[#fff6f6] shadow-[0_1.656px_8.282px_rgba(0,0,0,0.06)]';
    return 'cursor-pointer border-slate-200 hover:border-slate-300';
};

const PaymentMethodRow = ({
    label,
    icon,
    amount,
    brandLogo,
    checked = false,
    disabled = false,
    badge,
    handleSelection,
}: PaymentMethodRowProps) => (
    <button
        type="button"
        onClick={handleSelection}
        disabled={disabled}
        aria-pressed={checked}
        className={`flex w-full items-center gap-3 rounded-xl border p-3.5 text-left transition-[background-color,border-color,box-shadow] duration-500 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lightRed focus-visible:ring-offset-2 motion-reduce:transition-none ${getRowStateClasses(disabled, checked)}`}
    >
        <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-500 ease-out motion-reduce:transition-none ${
                checked ? 'bg-[#ffe1e1]' : 'bg-[#ecf0ff]'
            }`}
        >
            <img src={icon} alt="" className="h-[26px] w-[26px] object-contain" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-xs font-semibold text-slate-900 sm:text-sm">{label}</span>
            {amount && (
                <span className="text-xs font-semibold tracking-wide text-textGreen">
                    ₹ {amount}
                </span>
            )}
            {badge && <span className="text-xs text-slate-400">{badge}</span>}
        </span>
        {brandLogo && (
            <img
                src={brandLogo}
                alt=""
                className="hidden h-5 w-auto max-w-[72px] shrink-0 object-contain xs375:block"
            />
        )}
        {!disabled && (
            <span
                aria-hidden="true"
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-500 ease-out motion-reduce:transition-none ${
                    checked ? 'border-lightRed bg-lightRed' : 'border-slate-300 bg-white'
                }`}
            >
                <svg
                    viewBox="0 0 12 10"
                    fill="none"
                    className={`h-2.5 w-2.5 transition-opacity duration-500 ease-out motion-reduce:transition-none ${checked ? 'opacity-100' : 'opacity-0'}`}
                >
                    <path
                        d="M1 5L4.5 8.5L11 1.5"
                        stroke="white"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />
                </svg>
            </span>
        )}
    </button>
);

export default PaymentMethodRow;
