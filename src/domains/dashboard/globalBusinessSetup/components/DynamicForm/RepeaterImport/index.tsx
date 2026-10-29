import React, { useMemo, useState } from 'react';

import { UploadOutlined } from '@ant-design/icons';
import { Button, message } from 'antd';
import { getIn, useFormikContext } from 'formik';

import { buildInstancesFromRows, enforceInstanceCount, validateInstances } from './buildInstances';
import { buildCountryResolver } from './coerceCell';
import { downloadImportTemplate, exportInstancesToExcel, parseImportFile } from './excelIO';
import { ACCEPTED_IMPORT_EXTENSIONS, mapColumnsToFields } from './mapColumns';
import RepeaterImportModal from './RepeaterImportModal';
import { ImportInstance, ParsedImport } from './types';
import { useCountries } from '../../../hooks/useCountries';
import { IForm, IRepeater, ISection } from '../../../types/forms';
import { isInstanceFilled } from '../RepeaterSummary';

interface RepeaterImportProps {
    section: ISection;
    form: IForm;
    pageId: string;
    sectionId: string;
    noun: string;
    instanceCount: number;
    onReplace: (objects: ImportInstance[]) => void;
    // field_value repeaters: write the imported count to the driver field so
    // the section's sync effect reconciles.
    onDriverWrite?: (count: number) => void;
}

/**
 * "Bulk Import" for repeater sections: parse a CSV/Excel file, map columns to
 * fields, coerce + validate cell values, preview, then atomically replace the
 * section's instances. Ported (antd + Formik) from the vendor's RepeaterImport.
 */
export default function RepeaterImport({
    section,
    form,
    pageId,
    sectionId,
    noun,
    instanceCount,
    onReplace,
    onDriverWrite,
}: RepeaterImportProps) {
    const { values } = useFormikContext<any>();
    const [open, setOpen] = useState(false);
    const [parsing, setParsing] = useState(false);
    const [parsed, setParsed] = useState<ParsedImport | null>(null);

    const repeater: IRepeater = section.repeater || { enabled: false };

    const hasCountryField = useMemo(
        () => section.fields.some(f => f.type === 'country' && !f.view?.is_hidden),
        [section.fields]
    );
    const { countryOptions } = useCountries('', '', hasCountryField ? 'is_active=true' : '');
    const countryResolver = useMemo(
        () => (hasCountryField ? buildCountryResolver(countryOptions) : undefined),
        [hasCountryField, countryOptions]
    );
    const countryLabelById = useMemo(() => {
        const map: Record<string, string> = {};
        countryOptions.forEach(c => {
            map[c.value] = c.label;
        });
        return map;
    }, [countryOptions]);

    const currentInstances: ImportInstance[] = useMemo(
        () =>
            Array.from(
                { length: instanceCount },
                (_, i) =>
                    (getIn(values, `pages.${pageId}.${sectionId}.${i}`) as ImportInstance) || {}
            ),
        [values, pageId, sectionId, instanceCount]
    );
    const hasData = currentInstances.some(inst => isInstanceFilled(section, inst));

    const handleClose = () => {
        setOpen(false);
        setParsed(null);
        setParsing(false);
    };

    const handleFile = async (file: File) => {
        const ok = ACCEPTED_IMPORT_EXTENSIONS.some(ext => file.name.toLowerCase().endsWith(ext));
        if (!ok) {
            message.error('Please upload a CSV (.csv) or Excel (.xlsx) file');
            return;
        }

        setParsing(true);
        try {
            const { headers, rows } = await parseImportFile(file);
            if (!rows.length) {
                message.error('No data rows found in the file');
                return;
            }

            const mapping = mapColumnsToFields(headers, section);
            if (!mapping.mappings.length) {
                message.error(
                    'No columns matched this section — start from the downloaded template'
                );
                return;
            }

            const { instances, warnings } = buildInstancesFromRows(
                rows,
                mapping.mappings,
                section,
                countryResolver
            );
            setParsed({
                instances,
                warnings,
                rowValidations: validateInstances(instances, section, form),
                unmatchedColumns: mapping.unmatchedColumns,
                unmatchedRequiredFields: mapping.unmatchedRequiredFields,
                mappings: mapping.mappings,
            });
        } catch {
            message.error('Could not read the file — please upload a valid CSV or Excel file');
        } finally {
            setParsing(false);
        }
    };

    const handleApply = () => {
        if (!parsed) return;
        const { instances, note } = enforceInstanceCount(parsed.instances, section, repeater);
        onReplace(instances);
        onDriverWrite?.(instances.length);
        message.success(
            `Imported ${instances.length} ${noun.toLowerCase()}(s)${note ? ` — ${note}` : ''}`
        );
        handleClose();
    };

    return (
        <>
            <Button icon={<UploadOutlined />} onClick={() => setOpen(true)}>
                Bulk Import
            </Button>
            <RepeaterImportModal
                open={open}
                noun={noun}
                parsing={parsing}
                parsed={parsed}
                hasData={hasData}
                countryLabelById={countryLabelById}
                onFile={handleFile}
                onDownloadTemplate={() => downloadImportTemplate(section)}
                onExport={() => exportInstancesToExcel(section, currentInstances, countryLabelById)}
                onApply={handleApply}
                onClose={handleClose}
            />
        </>
    );
}
