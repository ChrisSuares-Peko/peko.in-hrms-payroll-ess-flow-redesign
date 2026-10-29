import * as Yup from 'yup';

import { withSpaceValidation } from '../utils/yupHelpers';

export const CompanyDetailsSchema = Yup.object().shape({
    communicationAddress: withSpaceValidation(Yup.string().trim(), 'Communication address'),
    registeredAddress: withSpaceValidation(Yup.string().trim(), 'Registered address'),
    settlementBankAccountDetails: withSpaceValidation(
        Yup.string().trim(),
        'Settlement bank account details'
    ),
    proofOfRegisteredAddress: Yup.mixed().nullable(),
    localTaxIdentifier: Yup.mixed().nullable(),
    certificateOfIncorporation: Yup.mixed().nullable(),
    boardResolution: Yup.mixed().nullable(),
    beneficiaryOwnerInfo: Yup.mixed().nullable(),
    pciDssCertification: Yup.mixed().nullable(),
    settlementBankAccountProof: Yup.mixed().nullable(),
    lobSpecificDocument: Yup.mixed().nullable(),
    gstCertificate: Yup.mixed().nullable(),
});
