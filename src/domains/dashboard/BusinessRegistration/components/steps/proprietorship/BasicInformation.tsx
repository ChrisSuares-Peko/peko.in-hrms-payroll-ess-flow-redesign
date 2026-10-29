import { Typography } from 'antd';
import { useFormikContext } from 'formik';

import BusinessActivity from './BusinessActivity';
import EntityTypeBanner from './EntityTypeBanner';
import PrimaryContact from './PrimaryContact';
import ProposedTradeName from './ProposedTradeName';
import { EntityType } from '../../../types';
import { ENTITY_SHORT_LABELS } from '../../../utils/data';

const { Title, Paragraph } = Typography;

interface BasicInfoValues {
    entityType?: EntityType;
}

// Step 1 of the Proprietorship registration form (Figma 1819:23049).
// Registered-office availability/address moved to the KYC step (post-payment,
// 23-07 vendor-call flow) — see RegisteredOfficeSection.
const BasicInformation = () => {
    const { values } = useFormikContext<BasicInfoValues>();
    const entityLabel = values.entityType
        ? ENTITY_SHORT_LABELS[values.entityType]
        : 'Proprietorship';
    // Proprietorship collects no business activity before payment (PDF §A) — the
    // NIC/activity is captured later in the Udyam engagement on the vendor side.
    const isProprietorship = values.entityType === EntityType.PROPRIETORSHIP;
    // Up to 3 business activities for every entity type.
    const maxActivities = 3;

    return (
        <div className="flex flex-col gap-4">
            <div>
                <Title
                    level={3}
                    className="!text-[24px] !font-semibold !text-[#1e293b] !mb-1 !leading-[32px]"
                >
                    Basic Information
                </Title>
                <Paragraph className="!mb-0 text-[16px] text-[#6a7282] !leading-[24px]">
                    {isProprietorship
                        ? 'Business name, state & payment'
                        : 'Trade name, business activity, registrations & payment'}
                </Paragraph>
            </div>

            <div className="bg-white rounded-[30px] p-3 sm:p-6 shadow-[0px_1.5px_16.5px_0px_rgba(0,0,0,0.06)] flex flex-col gap-6">
                <EntityTypeBanner entityLabel={entityLabel} />
                <PrimaryContact />
                <ProposedTradeName />
                {!isProprietorship && (
                    <BusinessActivity
                        maxActivities={maxActivities}
                        descriptionOnly={values.entityType === EntityType.PARTNERSHIP}
                    />
                )}
            </div>
        </div>
    );
};

export default BasicInformation;
