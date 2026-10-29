import { LlpAgreementController } from './useLlpAgreement';
import RadioCard from '../../ui/RadioCard';
import UploadBox from '../../ui/UploadBox';

export default function TemplateCard({ controller }: { controller: LlpAgreementController }) {
    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-base font-semibold text-gray-800">LLP Agreement Template</h3>
                <p className="text-sm text-gray-500">
                    The LLP Agreement is a mandatory document that defines the mutual rights and
                    duties of partners
                </p>
            </div>

            <div className="space-y-3">
                <RadioCard
                    badge="(Auto generated)"
                    selected={controller.llpType === 'standard'}
                    title="Standard LLP Agreement"
                    onSelect={() => controller.setLlpType('standard')}
                />
                <RadioCard
                    selected={controller.llpType === 'custom'}
                    title="Custom LLP Agreement"
                    onSelect={() => controller.setLlpType('custom')}
                >
                    <UploadBox
                        error={controller.customLlpFileError}
                        value={controller.customLlpFile}
                        onChange={controller.setCustomLlpFile}
                    />
                </RadioCard>
            </div>

            {controller.llpType === 'standard' && (
                <div className="flex items-center gap-2" style={{ color: '#FF4F4F' }}>
                    <p className="text-xs font-medium">
                        ✦ The agreement below is auto-generated from your inputs.
                    </p>
                </div>
            )}
        </section>
    );
}
