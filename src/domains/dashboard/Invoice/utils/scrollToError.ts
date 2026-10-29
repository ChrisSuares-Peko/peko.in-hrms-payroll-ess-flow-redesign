const scrollToError = (errors: any) => {
    const errorsKeys = Object.keys(errors);
    if (errorsKeys.length > 0) {
        const firstField: HTMLInputElement | null = document.querySelector(
            `input[name="${errorsKeys[0]}"]`
        );
        if (firstField) firstField.focus();
    }
};

export default scrollToError;
