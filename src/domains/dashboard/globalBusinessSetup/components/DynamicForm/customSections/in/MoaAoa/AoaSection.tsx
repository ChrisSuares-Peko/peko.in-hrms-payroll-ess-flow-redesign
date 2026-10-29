import { Button } from 'antd';

import { MoaAoaController } from './useMoaAoa';
import RadioCard from '../../ui/RadioCard';
import UploadBox from '../../ui/UploadBox';

type AoaSectionProps = {
    controller: MoaAoaController;
    onPreview: () => void;
};

export default function AoaSection({ controller, onPreview }: AoaSectionProps) {
    return (
        <section className="space-y-3">
            <div>
                <h3 className="text-base font-semibold text-gray-800">
                    Articles of Association (AOA)
                </h3>
                <p className="text-sm text-gray-500">
                    The AOA contains rules and regulations for internal management of the company.
                </p>
            </div>

            <RadioCard
                action={
                    <Button size="small" onClick={onPreview}>
                        Preview
                    </Button>
                }
                selected={controller.aoaType === 'standard'}
                subtitle="Schedule I, Companies Act 2013 — auto-filled with your company details"
                title="Standard Table F AOA"
                onSelect={() => controller.setAoaType('standard')}
            />

            <RadioCard
                selected={controller.aoaType === 'custom'}
                title="Customized AOA"
                onSelect={() => controller.setAoaType('custom')}
            >
                <UploadBox
                    error={controller.customAoaFileError}
                    value={controller.customAoaFile}
                    onChange={controller.setCustomAoaFile}
                />
            </RadioCard>
        </section>
    );
}
