import {
    Gstr9FormData,
    Gstr9SavePayload,
    Gstr9SecSumEntry,
    Gstr9Table4,
    Gstr9Table5,
} from '../../types';

const buildIdx = (secSum: Gstr9SecSumEntry[]) =>
    secSum.reduce<Record<string, Gstr9SecSumEntry>>((acc, s) => {
        acc[s.sec_nm] = s;
        return acc;
    }, {});

const fromSec = (idx: Record<string, Gstr9SecSumEntry>, nm: string) => {
    const s = idx[nm];
    return s
        ? {
              iamt: s.ttl_igst ?? 0,
              camt: s.ttl_cgst ?? 0,
              samt: s.ttl_sgst ?? 0,
              csamt: s.ttl_cess ?? 0,
              txval: s.ttl_val ?? 0,
          }
        : undefined;
};

export const deriveTable4 = (secSum: Gstr9SecSumEntry[]): Gstr9Table4 => {
    const idx = buildIdx(secSum);
    const expSub = idx.EXP?.sub_sections ?? [];
    const expwp = expSub.find(s => s.typ === 'EXPWP');
    return {
        b2b: fromSec(idx, 'B2B_4A'),
        b2c: fromSec(idx, 'B2CS'),
        exp: expwp
            ? { iamt: expwp.ttl_igst ?? 0, camt: expwp.ttl_cgst ?? 0, samt: expwp.ttl_sgst ?? 0 }
            : undefined,
        sez: fromSec(idx, 'B2B_SEZWP'),
        deemed: fromSec(idx, 'B2B_6C'),
        at: fromSec(idx, 'AT'),
        rchrg: fromSec(idx, 'B2B_4B'),
        cr_nt: fromSec(idx, 'CDNR'),
        dr_nt: fromSec(idx, 'CDNUR'),
        amd_pos: fromSec(idx, 'B2BA_4A'),
        amd_neg: fromSec(idx, 'B2BA_4B'),
    };
};

export const buildGstr9SavePayload = (formData: Gstr9FormData): Gstr9SavePayload => {
    const secSum = formData.sec_sum ?? [];
    const table4 = formData.table4 ?? deriveTable4(secSum);
    const table5 = formData.table5 ?? deriveTable5(secSum);
    const t6 = formData.table6;
    const t9 = formData.table9;
    const itc = t6?.itc_3b;

    return {
        gstin: formData.gstin,
        fp: formData.ret_period,
        table4,
        table5,
        table6: {
            supp_non_rchrg: [
                { itc_typ: 'cg', iamt: 0, camt: 0, samt: 0, csamt: 0 },
                {
                    itc_typ: 'is',
                    iamt: itc?.iamt ?? 0,
                    camt: itc?.camt ?? 0,
                    samt: itc?.samt ?? 0,
                    csamt: itc?.csamt ?? 0,
                },
            ],
            isd: {
                iamt: t6?.isd?.iamt ?? 0,
                camt: t6?.isd?.camt ?? 0,
                samt: t6?.isd?.samt ?? 0,
                csamt: t6?.isd?.csamt ?? 0,
            },
            tran1: { camt: t6?.tran1?.camt ?? 0, samt: t6?.tran1?.samt ?? 0 },
            tran2: { camt: t6?.tran2?.camt ?? 0, samt: t6?.tran2?.samt ?? 0 },
        },
        table9: {
            iamt: { txpyble: t9?.iamt?.txpyble ?? 0 },
            camt: { txpyble: t9?.camt?.txpyble ?? 0 },
            samt: { txpyble: t9?.samt?.txpyble ?? 0 },
            csamt: { txpyble: t9?.csamt?.txpyble ?? 0 },
            intr: { txpyble: t9?.intr?.txpyble ?? 0 },
            fee: { txpyble: t9?.fee?.txpyble ?? 0 },
        },
    };
};

export const deriveTable5 = (secSum: Gstr9SecSumEntry[]): Gstr9Table5 => {
    const idx = buildIdx(secSum);
    const nil = idx.NIL;
    const expSub = idx.EXP?.sub_sections ?? [];
    const expwop = expSub.find(s => s.typ === 'EXPWOP');
    return {
        zero_rtd: { txval: expwop?.ttl_val ?? 0 },
        sez: { txval: idx.B2B_SEZWOP?.ttl_val ?? 0 },
        rchrg: { txval: 0 },
        exmt: { txval: nil?.ttl_expt_amt ?? 0 },
        nil: { txval: nil?.ttl_nilsup_amt ?? 0 },
        non_gst: { txval: nil?.ttl_ngsup_amt ?? 0 },
        cr_nt: { txval: 0 },
        dr_nt: { txval: 0 },
        amd_pos: { txval: 0 },
        amd_neg: { txval: 0 },
    };
};

export const buildGstr9FilePayload = (detailsResponse: any) => {
    const data = detailsResponse.data?.formData;
    return {
        ...data,
        isnil: detailsResponse.data?.isnil || 'N',
        aggTurnover: detailsResponse.data?.aggTurnover || data?.aggTurnover,
        tax_pay: detailsResponse.data?.tax_pay || [
            {
                sgst: { intr: 0, oth: 0, tx: 0, fee: 0, tot: 0, pen: 0 },
                trancd: 30002,
                cgst: { intr: 0, oth: 0, tx: 0, fee: 0, tot: 0, pen: 0 },
                liab_id: 0,
            },
        ],
    };
};
