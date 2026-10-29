import { disputeLabel, quorumLabel, votingLabel } from './constants';
import { Partner } from './resolve';
import { escapeHtml } from '../../htmlDoc';

export type LlpTemplateArgs = {
    companyName: string;
    nicCode: string;
    partners: Partner[];
    totalCapital: string;
    rights: string[];
    duties: string[];
    meetingQuorum: string;
    votingThreshold: string;
    disputeMethod: string;
    jurisdiction: string;
};

const bullets = (items: string[]) =>
    items.length
        ? `<p>${items.map(i => `• ${escapeHtml(i)}`).join('<br/>')}</p>`
        : `<p class="muted">None selected</p>`;

const partnerBlock = (index: number, p: Partner) =>
    `<p><strong>Partner ${index}${p.designation ? ` (${escapeHtml(p.designation)})` : ''} – ${escapeHtml(p.name) || '—'}</strong><br/>` +
    `Contribution: Rs. ${escapeHtml(p.contribution) || '—'}<br/>` +
    `Profit Share: ${escapeHtml(p.profitShare) || '—'}</p>`;

// Concise summary of the customized LLP Agreement (draft) built from form data.
export const buildLlpHtml = (a: LlpTemplateArgs): string => {
    const name = escapeHtml(a.companyName) || 'The LLP';
    const partnersHtml = a.partners.length
        ? a.partners.map((p, i) => partnerBlock(i + 1, p)).join('')
        : `<p class="muted">No partners added.</p>`;

    return `
        <h1>Limited Liability Partnership Agreement</h1>
        <p class="center">OF<br/><strong>${name}</strong></p>
        <p class="muted">This is a summary of your customized LLP Agreement</p>

        <h2>Partners</h2>
        ${partnersHtml}

        <h2>Capital Contribution</h2>
        <p>Total Capital Contribution: Rs. ${escapeHtml(a.totalCapital) || '—'}</p>

        <h2>Business Activities</h2>
        <p>${escapeHtml(a.nicCode) || '—'}</p>

        <h2>Partner Rights</h2>
        ${bullets(a.rights)}

        <h2>Partner Duties</h2>
        ${bullets(a.duties)}

        <h2>Management</h2>
        <p>Meeting Quorum: ${escapeHtml(quorumLabel(a.meetingQuorum))}<br/>
        Voting Threshold: ${escapeHtml(votingLabel(a.votingThreshold))}</p>

        <h2>Dispute Resolution</h2>
        <p>Method: ${escapeHtml(disputeLabel(a.disputeMethod))}<br/>
        Jurisdiction: ${escapeHtml(a.jurisdiction) || '—'}</p>

        <div class="draft"><strong>NOTE:</strong> This is a draft preview. The final LLP Agreement
        will be prepared by legal professionals.</div>
    `;
};
