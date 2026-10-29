import { ReactNode } from 'react';

type RadioCardProps = {
    selected: boolean;
    onSelect: () => void;
    title: string;
    badge?: string;
    subtitle?: string;
    action?: ReactNode;
    children?: ReactNode;
};

export default function RadioCard({
    selected,
    onSelect,
    title,
    badge,
    subtitle,
    action,
    children,
}: RadioCardProps) {
    return (
        <div
            style={selected ? { border: '1px solid #FF4F4F' } : undefined}
            className={`w-full rounded-xl transition-colors p-4 ${selected ? '' : 'border border-gray-200'}`}
        >
            <div className="flex items-start justify-between gap-3">
                <button
                    className="flex flex-1 items-start gap-3 text-left"
                    type="button"
                    onClick={onSelect}
                >
                    <span
                        style={selected ? { borderColor: '#FF4F4F' } : undefined}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${selected ? '' : 'border-gray-300'}`}
                    >
                        {selected && (
                            <span
                                className="h-2.5 w-2.5 rounded-full"
                                style={{ background: '#FF4F4F' }}
                            />
                        )}
                    </span>
                    <span>
                        <span className="text-sm font-medium text-gray-800">
                            {title}
                            {badge && (
                                <span className="ms-1 font-normal text-gray-400">{badge}</span>
                            )}
                        </span>
                        {subtitle && (
                            <span className="mt-0.5 block text-xs text-gray-500">{subtitle}</span>
                        )}
                    </span>
                </button>
                {action}
            </div>
            {selected && children && <div className="mt-4 w-full">{children}</div>}
        </div>
    );
}
