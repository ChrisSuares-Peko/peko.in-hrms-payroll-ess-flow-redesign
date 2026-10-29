import { PARTNER_DUTIES, PARTNER_RIGHTS } from './constants';
import { buildLlpHtml } from './llpTemplate';
import { buildLlpData, resolveLlpInputs } from './resolve';
import { toPdfFile } from '../../pdf/generatePdf';
import { FormValuesMap } from '../../useFormValues';

type FieldEntry = { field: string; name: string; value: unknown };

/**
 * Build the LLP Agreement PDF from the final submitted values and write it onto the
 * `generated_llp_file` field. Runs at submit time (not tied to the component being
 * mounted), so it reflects the latest data even if the page was never opened.
 */
export async function generateLlpDocs(
    values: FormValuesMap,
    config: Record<string, unknown>,
    fields: FieldEntry[]
) {
    const getField = (name: string) => fields.find(f => f.name === name)?.value;
    const setField = (name: string, value: unknown) => {
        const entry = fields.find(f => f.name === name);

        if (entry) entry.value = value;
    };

    const { companyName, activity, partners } = buildLlpData(values, config);
    const inputs = resolveLlpInputs(getField);

    // Persist resolved selections so the saved submission matches the PDF.
    setField('total_capital', inputs.totalCapital);
    setField('meeting_quorum', inputs.meetingQuorum);
    setField('voting_threshold', inputs.votingThreshold);
    setField('dispute_method', inputs.disputeMethod);
    PARTNER_RIGHTS.forEach(r => setField(`right_${r.key}`, inputs.rights.includes(r.label)));
    PARTNER_DUTIES.forEach(d => setField(`duty_${d.key}`, inputs.duties.includes(d.label)));

    if (inputs.llpType !== 'standard') {
        setField('generated_llp_file', undefined);

        return;
    }

    const html = buildLlpHtml({
        companyName,
        nicCode: activity.code,
        partners,
        totalCapital: inputs.totalCapital,
        rights: inputs.rights,
        duties: inputs.duties,
        meetingQuorum: inputs.meetingQuorum,
        votingThreshold: inputs.votingThreshold,
        disputeMethod: inputs.disputeMethod,
        jurisdiction: inputs.jurisdiction,
    });

    setField('generated_llp_file', await toPdfFile(html, `LLP Agreement - ${companyName}.pdf`));
}
