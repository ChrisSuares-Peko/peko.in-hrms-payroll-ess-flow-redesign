import { useState } from 'react';

import { CheckOutlined, SaveOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useFormikContext } from 'formik';

import { useDraftSave } from '../../context/draftSave';

// Saves the whole draft to the server on demand. Progress is otherwise persisted
// only on "Next", so on the long KYC step this lets a user store each person as
// they go — no re-filling if they lose connection, reload or step back.
const SaveProgressButton = ({ label = 'Save progress' }: { label?: string }) => {
    const save = useDraftSave();
    const { values } = useFormikContext<Record<string, unknown>>();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    if (!save) return null;

    const onClick = async () => {
        setSaving(true);
        const ok = await save(values);
        setSaving(false);
        if (ok) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const tone = saved
        ? '!border-[#22c55e] !text-[#16a34a] hover:!bg-[#f0fdf4]'
        : '!border-[#ff4f4f] !text-[#ff4f4f] hover:!bg-[#fff5f5]';

    return (
        <Button
            size="small"
            loading={saving}
            icon={saved ? <CheckOutlined /> : <SaveOutlined />}
            onClick={onClick}
            className={`!h-[36px] !px-4 !text-[14px] !font-medium !rounded-[8px] transition-colors ${tone}`}
        >
            {saved ? 'Saved' : label}
        </Button>
    );
};

export default SaveProgressButton;
