import { Application, ApplicationStatus, VendorStage } from '../types';

// `application.status` is advanced by the vendor webhook and can lag behind the
// vendorStages timeline (refreshed by polling). Prefer a definitive status;
// otherwise fall back to the stages so a registered company isn't shown as
// "Submitted / under review".
export const getEffectiveStatus = (application: Application): ApplicationStatus => {
    if (
        application.status === ApplicationStatus.PENDING ||
        application.status === ApplicationStatus.APPROVED ||
        application.status === ApplicationStatus.REJECTED
    ) {
        return application.status;
    }
    const stages: VendorStage[] = Array.isArray(application.vendorStages) ? application.vendorStages : [];
    const last = stages[stages.length - 1];
    const isRegistered =
        last?.state === 'completed' && /success|registered|approved|incorporat/i.test(`${last.title} ${last.description}`);
    return isRegistered ? ApplicationStatus.APPROVED : application.status;
};
