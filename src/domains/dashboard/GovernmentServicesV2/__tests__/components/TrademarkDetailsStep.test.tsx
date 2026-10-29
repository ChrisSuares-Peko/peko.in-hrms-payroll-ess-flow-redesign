import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Formik } from 'formik';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TrademarkClassDescription } from '../../apis';
import TrademarkDetailsStep from '../../components/steps/TrademarkDetailsStep';
import { ApplicantDetailsValues } from '../../types';
import { EMPTY_VALUES } from '../../utils/trademarkForm';

const languageOptions = [
    { label: 'English', value: 'English' },
    { label: 'Hindi', value: 'Hindi' },
];

const classDescriptions: TrademarkClassDescription[] = [
    { class: 9, description: 'Computer software' },
    { class: 9, description: 'Mobile apps' },
    { class: 25, description: 'Clothing' },
];

// antd DatePicker/Select interactions are slow when the suite runs under parallel load.
vi.setConfig({ testTimeout: 30000 });

const setFieldValueSpy = vi.fn();
const onBrandSearch = vi.fn();
const onGoodsOrServiceChange = vi.fn();

const renderStep = (
    values: Partial<ApplicantDetailsValues> = {},
    props: Partial<Parameters<typeof TrademarkDetailsStep>[0]> = {}
) =>
    render(
        <Formik initialValues={{ ...EMPTY_VALUES, ...values }} onSubmit={vi.fn()}>
            {(formik) => (
                <>
                    {/* maxTagCount="responsive" can't measure tags in jsdom, so expose the value directly. */}
                    <output data-testid="description-value">{formik.values.description.join('|')}</output>
                    <TrademarkDetailsStep
                        values={formik.values}
                        setFieldValue={(field, value) => {
                            setFieldValueSpy(field, value);
                            formik.setFieldValue(field, value);
                        }}
                        languageOptions={languageOptions}
                        isSearchingSimilar={false}
                        onBrandSearch={onBrandSearch}
                        isSearchingGoodsOrService={false}
                        onGoodsOrServiceChange={onGoodsOrServiceChange}
                        classDescriptions={classDescriptions}
                        {...props}
                    />
                </>
            )}
        </Formik>
    );

const selectRoot = (id: string) => document.getElementById(id)!.closest('.ant-select') as HTMLElement;

// MultiSelectInput sets no id on its Select, so locate it through its form-item label.
const descriptionSelect = () =>
    screen.getByText('Description').closest('.ant-form-item')!.querySelector('.ant-select') as HTMLElement;

const openSelect = (id: string) => {
    fireEvent.mouseDown(selectRoot(id).querySelector('.ant-select-selector')!);
};

const optionByTitle = (label: string) => document.querySelector(`.ant-select-item-option[title="${label}"]`);

const brandSearchButton = () =>
    screen
        .getByPlaceholderText('Enter the brand name')
        .closest('.ant-input-affix-wrapper')!
        .querySelector('button') as HTMLButtonElement;

const goodsSuffix = () =>
    screen.getByPlaceholderText('e.g., clothing, software development').closest('.ant-input-affix-wrapper')!;

describe('TrademarkDetailsStep', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the core fields and prefills them', () => {
        renderStep({
            brand: 'Peko',
            language: 'English',
            mainGoodsOrService: 'software',
            trademarkClass: '9',
            associatedMarks: 'PEKO ONE',
        });

        expect(screen.getByPlaceholderText('Enter the brand name')).toHaveValue('Peko');
        expect(screen.getByPlaceholderText('e.g., clothing, software development')).toHaveValue('software');
        expect(screen.getByPlaceholderText('Associated Marks')).toHaveValue('PEKO ONE');
        expect(selectRoot('language')).toHaveTextContent('English');
        expect(selectRoot('trademarkClass')).toHaveTextContent('9');
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByRole('checkbox')).not.toBeChecked();
    });

    it('hides transliteration/translation when no language or English is chosen', () => {
        const { unmount } = renderStep();
        expect(screen.queryByText('Transliteration of the Mark')).not.toBeInTheDocument();
        unmount();

        renderStep({ language: 'English' });
        expect(screen.queryByText('Transliteration of the Mark')).not.toBeInTheDocument();
        expect(screen.queryByText('Translation of the Mark')).not.toBeInTheDocument();
    });

    it('shows transliteration/translation for a prefilled non-English language', () => {
        renderStep({ language: 'Hindi', transliterationOfMark: 'Peko', translationOfMark: 'Bird' });

        expect(screen.getByPlaceholderText('Enter the transliteration of the mark')).toHaveValue('Peko');
        expect(screen.getByPlaceholderText('Enter the translation of the mark')).toHaveValue('Bird');
    });

    it('reveals transliteration/translation after switching to a non-English language', () => {
        renderStep({ language: 'English' });

        openSelect('language');
        fireEvent.click(optionByTitle('Hindi')!);

        expect(screen.getByText('Transliteration of the Mark')).toBeInTheDocument();
        expect(screen.getByText('Translation of the Mark')).toBeInTheDocument();
    });

    it('calls onBrandSearch from the brand search button and shows its loading state', () => {
        const { unmount } = renderStep();
        fireEvent.click(brandSearchButton());
        expect(onBrandSearch).toHaveBeenCalledTimes(1);
        expect(brandSearchButton()).not.toHaveClass('ant-btn-loading');
        unmount();

        renderStep({}, { isSearchingSimilar: true });
        expect(brandSearchButton()).toHaveClass('ant-btn-loading');
    });

    it('reports goods/service changes and swaps the search icon for a spinner while searching', () => {
        const { unmount } = renderStep();
        fireEvent.change(screen.getByPlaceholderText('e.g., clothing, software development'), {
            target: { value: 'clothing' },
        });
        expect(onGoodsOrServiceChange).toHaveBeenCalledWith('clothing');
        expect(goodsSuffix().querySelector('[aria-label="search"]')).toBeInTheDocument();
        expect(goodsSuffix().querySelector('.ant-spin')).toBeNull();
        unmount();

        renderStep({}, { isSearchingGoodsOrService: true });
        expect(goodsSuffix().querySelector('.ant-spin')).toBeInTheDocument();
        expect(goodsSuffix().querySelector('[aria-label="search"]')).toBeNull();
    });

    it('only offers descriptions belonging to the selected class', () => {
        renderStep({ trademarkClass: '9' });

        fireEvent.mouseDown(descriptionSelect().querySelector('.ant-select-selector')!);
        expect(optionByTitle('Computer software')).toBeInTheDocument();
        expect(optionByTitle('Mobile apps')).toBeInTheDocument();
        expect(optionByTitle('Clothing')).toBeNull();
    });

    it('offers no descriptions when no class is selected', () => {
        renderStep();

        fireEvent.mouseDown(descriptionSelect().querySelector('.ant-select-selector')!);
        expect(document.querySelectorAll('.ant-select-item-option')).toHaveLength(0);
    });

    it('clears the description whenever the class changes', () => {
        renderStep({ trademarkClass: '9', description: ['Computer software'] });
        expect(screen.getByTestId('description-value')).toHaveTextContent('Computer software');

        openSelect('trademarkClass');
        fireEvent.click(optionByTitle('2')!);

        expect(setFieldValueSpy).toHaveBeenCalledWith('description', []);
        expect(selectRoot('trademarkClass')).toHaveTextContent('2');
        expect(screen.getByTestId('description-value')).toBeEmptyDOMElement();
    });

    it('shows Used Since only once the trademark is marked in use', () => {
        renderStep();
        expect(screen.queryByText('Used Since')).not.toBeInTheDocument();

        fireEvent.click(screen.getByRole('checkbox'));

        expect(screen.getByRole('checkbox')).toBeChecked();
        expect(screen.getByText('Used Since')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Select the date first used')).toBeInTheDocument();
    });

    it('displays a prefilled Used Since date in DD-MM-YYYY', () => {
        renderStep({ trademarkInUse: true, usedSince: '2024-01-15', usedSinceDisplay: '15-01-2024' });

        expect(screen.getByPlaceholderText('Select the date first used')).toHaveValue('15-01-2024');
    });

    it('mirrors a picked date into usedSince as YYYY-MM-DD', async () => {
        renderStep({ trademarkInUse: true, usedSinceDisplay: '15-01-2024' });

        const input = screen.getByPlaceholderText('Select the date first used');
        fireEvent.mouseDown(input);
        fireEvent.click(input);

        const cell = await waitFor(() => {
            const td = document.querySelector('td[title="2024-01-10"]');
            expect(td).toBeInTheDocument();
            return td as HTMLElement;
        });
        fireEvent.click(cell.querySelector('.ant-picker-cell-inner') ?? cell);
        const ok = document.querySelector('.ant-picker-ok button');
        if (ok) fireEvent.click(ok);

        await waitFor(() => expect(setFieldValueSpy).toHaveBeenCalledWith('usedSince', '2024-01-10'));
        expect(input).toHaveValue('10-01-2024');
    });

    it('clears usedSince when the Used Since date is cleared', async () => {
        renderStep({ trademarkInUse: true, usedSince: '2024-01-15', usedSinceDisplay: '15-01-2024' });

        const clear = document.querySelector('.ant-picker-clear');
        fireEvent.mouseDown(clear!);
        fireEvent.mouseUp(clear!);
        fireEvent.click(clear!);

        await waitFor(() => expect(setFieldValueSpy).toHaveBeenCalledWith('usedSince', ''));
        expect(screen.getByPlaceholderText('Select the date first used')).toHaveValue('');
    });
});
