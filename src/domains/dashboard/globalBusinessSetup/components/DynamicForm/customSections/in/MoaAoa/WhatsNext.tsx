import { WHATS_NEXT } from './constants';

export default function WhatsNext() {
    return (
        <div className="rounded-xl bg-gray-100/60 p-4">
            <p className="text-sm font-semibold text-gray-700">What happens next?</p>
            <ul className="mt-2 space-y-1">
                {WHATS_NEXT.map(item => (
                    <li key={item} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-gray-400">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}
