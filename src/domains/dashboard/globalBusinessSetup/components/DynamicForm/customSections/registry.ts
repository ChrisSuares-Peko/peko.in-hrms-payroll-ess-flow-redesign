import CapitalStructure from './in/CapitalStructure';
import { CAPITAL_FIELD_SPECS } from './in/CapitalStructure/constants';
import KycDocuments from './in/KycDocuments';
import { KYC_FIELD_SPECS } from './in/KycDocuments/constants';
import LlpAgreement from './in/LlpAgreement';
import { LLP_FIELD_SPECS } from './in/LlpAgreement/constants';
import { generateLlpDocs } from './in/LlpAgreement/generateDocs';
import MoaAoa from './in/MoaAoa';
import { MOA_FIELD_SPECS } from './in/MoaAoa/constants';
import { generateMoaAoaDocs } from './in/MoaAoa/generateDocs';
import OpcMoa from './in/OpcMoa';
import { OPC_FIELD_SPECS } from './in/OpcMoa/constants';
import { generateOpcMoaDocs } from './in/OpcMoa/generateDocs';
import ShareholdingPattern from './in/ShareholdingPattern';
import { SHAREHOLDING_FIELD_SPECS } from './in/ShareholdingPattern/constants';
import ShareholdingSummary from './in/ShareholdingPattern/ShareholdingSummary';
import { CustomSectionEntry } from './types';

export const customSectionRegistry: Record<string, CustomSectionEntry> = {
    capital_structure: {
        key: 'capital_structure',
        Render: CapitalStructure,
        fields: CAPITAL_FIELD_SPECS,
    },
    shareholding_pattern: {
        key: 'shareholding_pattern',
        Render: ShareholdingPattern,
        RepeaterFooter: ShareholdingSummary,
        fields: SHAREHOLDING_FIELD_SPECS,
    },
    kyc_documents: {
        key: 'kyc_documents',
        Render: KycDocuments,
        // Inline: the dispatcher lays out all director instances itself (the
        // upload-dashboard design) instead of the summary-rows + modal UX.
        repeaterDisplay: 'inline',
        fields: KYC_FIELD_SPECS,
    },
    moa_aoa: {
        key: 'moa_aoa',
        Render: MoaAoa,
        fields: MOA_FIELD_SPECS,
        finalize: ({ values, config, fields, section }) =>
            generateMoaAoaDocs(values, config, fields, section),
    },
    opc_moa: {
        key: 'opc_moa',
        Render: OpcMoa,
        fields: OPC_FIELD_SPECS,
        finalize: ({ values, config, fields, section }) =>
            generateOpcMoaDocs(values, config, fields, section),
    },
    llp_agreement: {
        key: 'llp_agreement',
        Render: LlpAgreement,
        fields: LLP_FIELD_SPECS,
        finalize: ({ values, config, fields }) => generateLlpDocs(values, config, fields),
    },
};

export const getCustomSectionEntry = (key?: string): CustomSectionEntry | undefined =>
    key ? customSectionRegistry[key] : undefined;
