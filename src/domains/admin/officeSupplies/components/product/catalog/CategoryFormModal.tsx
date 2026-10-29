import { useRef, useState } from 'react';

import { Form } from 'antd';

import CustomFileUploadInput from '@components/atomic/inputs/CustomFileUploadInput';
import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import {
    CATEGORY_NAME_MAX_LENGTH,
    ONDC_DOMAIN_MAX_LENGTH,
    ondcCategorySchema,
} from '../../../schema/ondcCategorySchema';
import { OndcCategoryFormValues, OndcCategoryRow } from '../../../types/ondcCategory';

type CategoryFormModalProps = {
    open: boolean;
    handleCancel: () => void;
    /** present when editing an existing category/subcategory */
    data?: OndcCategoryRow;
    /** present when adding a subcategory under this parent */
    parentId?: number;
    /** names already used under the same parent, excluding the row being edited */
    siblingNames: string[];
    createCategory: (values: OndcCategoryFormValues, parentId?: number) => Promise<boolean>;
    updateCategory: (id: number, values: OndcCategoryFormValues) => Promise<boolean>;
};

const CategoryFormModal = ({
    open,
    handleCancel,
    data,
    parentId,
    siblingNames,
    createCategory,
    updateCategory,
}: CategoryFormModalProps) => {
    let title = 'Add Category';
    if (data) title = data.parentId != null ? 'Edit Subcategory' : 'Edit Category';
    else if (parentId) title = 'Add Subcategory';

    const isSubcategory = !!parentId || (!!data && data.parentId != null);

    // CustomModalWithForm never shows its own submitting state (isLoading
    // defaults to false), so without this a double-clicked Submit sent two
    // creates — the second one a duplicate. The ref blocks a click that lands
    // before the spinner renders.
    const [saving, setSaving] = useState(false);
    const savingRef = useRef(false);

    return (
        <CustomModalWithForm
            reinitialise
            modalTitle={title}
            open={open}
            handleCancel={handleCancel}
            isLoading={saving}
            validationSchema={ondcCategorySchema(siblingNames, isSubcategory)}
            initialValues={{
                name: data?.name || '',
                ondcDomain: data?.ondcDomain || '',
                displayOrder: data?.displayOrder ?? 0,
                iconUrl: data?.iconUrl || '',
                iconFormat: null,
            }}
            handleFormSubmit={async values => {
                if (savingRef.current) return;
                savingRef.current = true;
                setSaving(true);
                try {
                    const ok = data
                        ? await updateCategory(data.id, values)
                        : await createCategory(values, parentId);
                    if (ok) handleCancel();
                } finally {
                    savingRef.current = false;
                    setSaving(false);
                }
            }}
        >
            {() => (
                <Form layout="vertical">
                    <TextInput
                        name="name"
                        label="Name"
                        type="text"
                        placeholder={isSubcategory ? 'e.g. Pens & Pencils' : 'e.g. Stationery'}
                        isRequired
                        maxLength={CATEGORY_NAME_MAX_LENGTH}
                    />
                    {isSubcategory && (
                        <TextInput
                            name="ondcDomain"
                            label="ONDC Domain"
                            type="text"
                            placeholder="e.g. RET16"
                            isRequired
                            maxLength={ONDC_DOMAIN_MAX_LENGTH}
                        />
                    )}
                    {!isSubcategory && (
                        <CustomFileUploadInput
                            existingFileUrl={data?.iconUrl ?? undefined}
                            label="Category icon"
                            name="iconUrl"
                            format="iconFormat"
                            showNotification
                            showFileName
                            isRequired
                            maxFileSize={2048}
                        />
                    )}
                    <TextInput
                        allowNumbersOnly
                        name="displayOrder"
                        label="Display Order"
                        type="text"
                        placeholder="0"
                        maxLength={5}
                    />
                </Form>
            )}
        </CustomModalWithForm>
    );
};

export default CategoryFormModal;
