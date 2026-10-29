import { useState } from 'react';

import eyeIcon from '../../assets/eyeIcon.svg';
import indiaGate from '../../assets/india-gate.svg';
import logo2 from '../../assets/logo2.svg';
import pekoCardLogo from '../../assets/peko-card-logo.svg';
import rupay from '../../assets/rupay.png';
import { cn } from '../../utils/cn';
import { CardData } from '../../utils/types';

interface PekoCardProps {
    card: CardData & { maskedCardNumber?: string };
    className?: string;
}

const CardField = ({ label, value }: { label: string; value: string }) => (
    <div className="flex flex-col" style={{ gap: '1.6cqw' }}>
        <span
            className="uppercase text-white/80"
            style={{ fontSize: '2.16cqw', letterSpacing: '0.04em' }}
        >
            {label}
        </span>
        <span className="font-medium text-white" style={{ fontSize: '2.97cqw' }}>
            {value}
        </span>
    </div>
);

const PekoCard = ({ card, className }: PekoCardProps) => {
    const [visible, setVisible] = useState(false);
    const cardNumber = visible
        ? (card.maskedCardNumber ?? `**** **** **** ${card.last4}`)
        : `**** ****** ${card.last4 ?? '****'}`;

    return (
        <div className={cn('relative', className)} style={{ containerType: 'inline-size' }}>
            <div
                className="relative w-full overflow-hidden"
                style={{
                    aspectRatio: '368.73 / 230',
                    borderRadius: '4cqw',
                    background:
                        'radial-gradient(ellipse at 32% 32%, #C42C2C 0%, #7A1515 40%, #480D0D 70%, #2D0707 100%)',
                }}
            >
                <img
                    src={indiaGate}
                    alt=""
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2"
                    style={{
                        transform: 'translate(-50%, -50%)',
                        width: '85%',
                        height: 'auto',
                        opacity: 0.9,
                    }}
                />

                <span
                    className="absolute text-white/50"
                    style={{
                        right: '2cqw',
                        top: '50%',
                        fontSize: '1.62cqw',
                        letterSpacing: '0.1em',
                        writingMode: 'vertical-rl',
                        transform: 'translateY(-50%) rotate(180deg)',
                    }}
                >
                    Corporate
                </span>

                <div
                    className="absolute inset-0 flex flex-col justify-between"
                    style={{ padding: '6.9cqw 5.4cqw' }}
                >
                    <div className="flex items-start justify-between">
                        <img
                            src={pekoCardLogo}
                            alt="Peko"
                            style={{ height: '4.6cqw', width: 'auto' }}
                        />
                        <img
                            src={logo2}
                            alt="pine labs"
                            style={{ height: '5.4cqw', width: 'auto' }}
                        />
                    </div>

                    <div className="flex items-end justify-between" style={{ gap: '4cqw' }}>
                        <div className="flex min-w-0 flex-col" style={{ gap: '2.7cqw' }}>
                            {(card.nameOnCard || card.holder) && (
                                <p
                                    className="truncate font-medium text-white"
                                    style={{ fontSize: '2.97cqw' }}
                                >
                                    {card.nameOnCard || card.holder}
                                </p>
                            )}
                            <div className="flex items-center" style={{ gap: '1.6cqw' }}>
                                <p
                                    className="font-medium text-white"
                                    style={{ fontSize: '4.64cqw', letterSpacing: '-0.01em' }}
                                >
                                    {cardNumber}
                                </p>
                                <button
                                    type="button"
                                    onClick={() => setVisible(v => !v)}
                                    className="flex shrink-0 items-center border-0 bg-transparent p-0 pb-0.5"
                                    aria-label={visible ? 'Hide card number' : 'Show card number'}
                                >
                                    <img
                                        src={eyeIcon}
                                        alt=""
                                        style={{ width: '4.66cqw', height: '4.66cqw' }}
                                    />
                                </button>
                            </div>
                            <div className="flex" style={{ gap: '4cqw' }}>
                                <CardField label="FROM" value="--" />
                                <CardField label="TO" value="--" />
                                <CardField label="CVV" value="***" />
                            </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end" style={{ gap: '1cqw' }}>
                            <img
                                src={rupay}
                                alt="RuPay"
                                style={{ height: '5cqw', width: 'auto' }}
                            />
                            <span
                                className="italic text-white/70"
                                style={{ fontSize: '2.7cqw', letterSpacing: '0.14em' }}
                            >
                                PREPAID
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PekoCard;
