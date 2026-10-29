import { BLANK, escapeHtml, pick } from '../../htmlDoc';
import { renderTemplate } from '../../template';

type Data = Record<string, unknown>;

export type MoaTemplateArgs = {
    data: Data;
    clause: string;
    ancillaryItems: { key: string; label: string }[];
};

type Subscriber = {
    name?: string;
    nationality?: string;
    occupation?: string;
    din?: string;
    shares?: string;
};

const renderSubscriber = (index: number, subscriber?: Subscriber) =>
    `<p>${index}. Name : ${escapeHtml(subscriber?.name) || BLANK}<br/>` +
    `Nationality : ${escapeHtml(subscriber?.nationality) || BLANK}<br/>` +
    `Occupation : ${escapeHtml(subscriber?.occupation) || BLANK}<br/>` +
    `DIN : ${escapeHtml(subscriber?.din) || '[DIN / Applied for]'}<br/>` +
    `No. of Shares : ${escapeHtml(subscriber?.shares) || '1 (One) Equity Share'}<br/>` +
    `Signature : ${BLANK}</p>`;

// Companies Act, 2013 Memorandum of Association (draft) built from the form data.
export const buildMoaHtml = ({ data, clause, ancillaryItems }: MoaTemplateArgs): string => {
    const name = escapeHtml(pick(data, ['company_name'], 'The Company'));
    const state = escapeHtml(
        pick(data, ['state', 'registered_office_state', 'registered_state', 'emirate'], BLANK)
    );
    const capital = escapeHtml(
        pick(data, ['authorised_capital', 'authorized_capital', 'capital'], BLANK)
    );
    const shareCount = escapeHtml(
        pick(data, ['number_of_shares', 'total_shares', 'shares'], '____')
    );
    const faceValue = escapeHtml(
        pick(data, ['share_value', 'face_value', 'nominal_value'], '____')
    );

    const mainObjects = renderTemplate(clause, data)
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean);
    const mainObjectsHtml = mainObjects.length
        ? mainObjects.map(o => `<li>${escapeHtml(o)}</li>`).join('')
        : `<li>${BLANK}</li>`;

    const ancillaryHtml = ancillaryItems.map(o => `<li>${escapeHtml(o.label)}</li>`).join('');

    const subscribers = Array.isArray(data.subscribers) ? (data.subscribers as Subscriber[]) : [];
    const subscribersHtml = subscribers.length
        ? subscribers.map((s, i) => renderSubscriber(i + 1, s)).join('')
        : `${renderSubscriber(1)}${renderSubscriber(2)}`;

    return `
        <h1>Memorandum of Association</h1>
        <p class="center">OF<br/><strong>${name}</strong></p>
        <p class="center muted">(THE COMPANIES ACT, 2013) &middot; (COMPANY LIMITED BY SHARES)</p>

        <div class="draft"><strong>⚠ DRAFT — FOR LEGAL REVIEW ONLY</strong><br/>This document is
        auto-generated for internal review. It must be reviewed and approved by a practising Company
        Secretary or Chartered Accountant before submission to the MCA.</div>

        <h2>I. Name Clause</h2>
        <p>The name of the Company is "<strong>${name}</strong>."</p>

        <h2>II. Situation Clause</h2>
        <p>The Registered Office of the Company will be situated in the State of ${state}.</p>

        <h2>III. Objects Clause</h2>
        <p><strong>(a)</strong> The objects to be pursued by the Company on its incorporation are:</p>
        <ol>${mainObjectsHtml}</ol>
        <p><strong>(b)</strong> Matters which are necessary for furtherance of the objects specified
        in clause (a) above are:</p>
        <ol>${ancillaryHtml}</ol>

        <h2>IV. Liability Clause</h2>
        <p>The liability of the Members of the Company is limited and this liability is limited to
        the amount unpaid, if any, on the shares held by them.</p>

        <h2>V. Capital Clause</h2>
        <p>The Authorised Share Capital of the Company is Rs. ${capital}/- divided into ${shareCount}
        Equity Shares of Rs. ${faceValue}/- each.</p>

        <h2>Declaration / Subscriber Clause</h2>
        <p>We, the several persons whose names, addresses, descriptions and occupations are given
        below, are desirous of being formed into a Company in pursuance of this Memorandum of
        Association, and we respectively agree to take the number of shares in the capital of the
        Company set against our respective names.</p>
        <div class="subscriber">${subscribersHtml}</div>

        <p class="mt">Place : ${state}<br/>Date : _____________________</p>
        <p class="muted">(To be signed in the presence of at least one witness)</p>
        <p>Witness Name : _____________________<br/>Witness Address : _____________________<br/>
        Witness Occupation : _____________________<br/>Witness Signature : _____________________</p>
    `;
};
