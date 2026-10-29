// The untouched default value for each dynamic-form field type. Shared by
// RepeatableSection (instance initialisation) and RepeaterImport /
// RepeaterClearButton (building blank/imported instance objects).
export const getDefaultValue = (fieldType: string, value?: any) => {
    if (value !== undefined && value !== null) {
        return value;
    }

    switch (fieldType) {
        case 'text':
        case 'textarea':
        case 'email':
        case 'radio':
            return '';
        case 'phone':
            return '+91';
        case 'number':
            return undefined;
        case 'select':
            return '';
        case 'checkbox':
            return false;
        case 'nested_select':
            return [];
        case 'date':
        case 'file':
        case 'image':
        default:
            return '';
    }
};
