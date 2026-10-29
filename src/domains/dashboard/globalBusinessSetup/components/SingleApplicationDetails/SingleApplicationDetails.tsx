import { Fragment, useMemo, useState } from 'react';

import { Card, Tabs, Typography, Descriptions, Empty as AntEmpty, Row } from 'antd';

import DateView from './DateView';
import EmailView from './EmailView';
import FileView from './FileView';
import PhoneView from './PhoneView';
import TextView from './TextView';
import { useCountries } from '../../hooks/useCountries';
import { FieldType, IField, IForm, IPage, ISection, SubmittedFormData } from '../../types/forms';
import { formatMoney } from '../../utils/pricingCalc';
import { formatNestedValue } from '../DynamicForm/utils/nestedSelectValue';

const { Title } = Typography;

type ApplicationProps = {
    company: SubmittedFormData;
    innerWrapperClassName?: string;
    formSchema?: IForm | null;
};

const isEmptyValue = (value: any) => {
    if (value === null || value === undefined) return true;
    if (typeof value === 'string') return value.trim() === '';
    if (Array.isArray(value)) return value.length === 0;
    return false;
};

// Resolve a saved-record value into something the type-specific view component
// (or fallback string) can render. Schema is the source of truth for `type`
// and option labels — the persisted record only carries `field` (id) + `value`.
const renderFieldValue = (
    schemaField: IField | undefined,
    value: any,
    countryOptions?: any[],
    fallbackType?: string
) => {
    const fieldType: FieldType | 'country' | undefined =
        schemaField?.type ?? (fallbackType as FieldType | 'country' | undefined);

    const lookupOptionLabel = (raw: any): string => {
        const opts = schemaField?.options;
        if (!Array.isArray(opts) || opts.length === 0) return String(raw ?? '');
        const opt = opts.find(o => o.value === raw);
        return opt?.label ?? String(raw ?? '');
    };

    switch (fieldType) {
        case 'file':
        case 'image':
            return <FileView file={value} />;
        case 'text':
        case 'number':
            return <TextView text={value} />;
        case 'textarea':
            return <TextView text={value} className="whitespace-pre-line line-clamp-none" />;
        case 'currency': {
            if (
                value === null ||
                value === undefined ||
                value === '' ||
                Number.isNaN(Number(value))
            )
                return <TextView text="-" />;
            const code = schemaField?.currency || 'USD';
            return <TextView text={formatMoney(Number(value), code)} />;
        }
        case 'date':
            return <DateView date={value} />;
        case 'email':
            return <EmailView email={value} />;
        case 'phone':
            return <PhoneView phone={value} />;
        case 'country':
            return countryOptions?.find(c => c?.value === value)?.label || value || '-';
        case 'select':
        case 'checkbox_group': {
            if (isEmptyValue(value)) return '-';
            if (Array.isArray(value)) {
                const labels = value.map(lookupOptionLabel).filter(Boolean);
                return labels.length > 0 ? labels.join(', ') : '-';
            }
            return lookupOptionLabel(value) || '-';
        }
        case 'nested_select': {
            if (isEmptyValue(value)) return '-';
            const formatted = Array.isArray(value) ? formatNestedValue(value) : String(value);
            return formatted || '-';
        }
        case 'radio': {
            if (isEmptyValue(value)) return '-';
            return lookupOptionLabel(value) || '-';
        }
        case 'checkbox':
            if (value === true || value === 'true' || value === 1 || value === '1') return 'Yes';
            return 'No';
        default:
            if (value && typeof value === 'object') return '-';
            return value || '-';
    }
};

export default function Application({
    company,
    innerWrapperClassName,
    formSchema,
}: ApplicationProps) {
    const pages = company?.pages || [];
    const { countryOptions } = useCountries('', '', 'is_active=true');

    // Build O(1) schema lookups by `_id` so we can recover human metadata
    // (page/section title, field label/type/options) for each persisted record.
    // Vendor's API saves only `_id` references on the form_data.
    const { pageMap, sectionMap, fieldMap } = useMemo(() => {
        const pMap = new Map<string, IPage>();
        const sMap = new Map<string, ISection>();
        const fMap = new Map<string, IField>();
        formSchema?.pages?.forEach(p => {
            pMap.set(p._id, p);
            p.sections?.forEach(s => {
                sMap.set(s._id, s);
                s.fields?.forEach(f => fMap.set(f._id, f));
            });
        });
        return { pageMap: pMap, sectionMap: sMap, fieldMap: fMap };
    }, [formSchema]);

    const firstPage = pages[0]?.page;
    const [currentPage, setCurrentPage] = useState<string | undefined>(firstPage);
    if (!pages.length) {
        return (
            <Card>
                <AntEmpty description="No application form data found." />
            </Card>
        );
    }

    const page = pages.find(p => p.page === currentPage) || pages[0];

    if (!page) {
        return (
            <Card>
                <AntEmpty description="No application form data found." />
            </Card>
        );
    }

    const items = pages.map(p => ({
        key: p.page,
        label: (
            <div className="whitespace-normal break-words">
                {pageMap.get(p.page)?.title || (p as any).title || 'Page'}
            </div>
        ),
    }));

    return (
        <Row className="overflow-x-hidden">
            <div className="w-full overflow-x-auto">
                <Tabs
                    activeKey={currentPage}
                    onChange={key => setCurrentPage(key)}
                    items={items}
                    tabBarStyle={{ marginBottom: 16 }}
                    type="line"
                />
            </div>

            <Card
                bordered
                style={{ borderRadius: 16 }}
                className={innerWrapperClassName || 'p-4 md:p-8'}
            >
                {(page.sections || []).map((section: any) => {
                    const visibleInstances = (section.instances || []).filter(
                        (inst: any) => Array.isArray(inst.fields) && inst.fields.length > 0
                    );

                    if (visibleInstances.length === 0) return null;

                    const sectionSchema = sectionMap.get(section.section);
                    const sectionTitle = sectionSchema?.title || section.title || 'Section';

                    return (
                        <Fragment key={section.section}>
                            <Title level={5} style={{ marginTop: 32 }}>
                                {sectionTitle}
                            </Title>

                            {visibleInstances.map((instance: any, idx: number) => {
                                const showInstanceTitle = visibleInstances.length > 1;

                                // Index saved fields by their schema `_id` so a
                                // conditional check can resolve its source by id.
                                const fieldsByFieldId = new Map<string, any>();
                                (instance.fields || []).forEach((f: any) => {
                                    if (f.field) fieldsByFieldId.set(f.field, f);
                                });
                                // Lookup helper for legacy payloads keyed by name.
                                const fieldsByName = new Map<string, any>();
                                (instance.fields || []).forEach((f: any) => {
                                    if (f.name) fieldsByName.set(f.name, f);
                                });

                                const visibleFields = (instance.fields || []).filter((f: any) => {
                                    const schema = fieldMap.get(f.field);
                                    // Hide internal/control fields — sentinels
                                    // (shareholders_valid, capital_cross_valid),
                                    // KYC gate flags (ctrl_*), and other hidden
                                    // fields carry no user-facing meaning here.
                                    if (schema?.view?.is_hidden || f.is_hidden) return false;
                                    if (isEmptyValue(f.value)) return false;
                                    const conditional = schema?.conditional ?? f.conditional;
                                    if (!conditional?.enabled || !conditional.source_field_name) {
                                        return true;
                                    }

                                    // source_field_name in the schema can be
                                    // a field name OR a complex path. We match
                                    // by name within this section first; if not
                                    // found, leave the field visible (defensive).
                                    const sourceName = conditional.source_field_name;
                                    const sourceRecord =
                                        fieldsByName.get(sourceName) ||
                                        // Fallback: look up by schema field whose
                                        // name matches, then resolve its record.
                                        (() => {
                                            const sourceSchemaField = sectionSchema?.fields?.find(
                                                sf => sf.name === sourceName
                                            );
                                            return sourceSchemaField
                                                ? fieldsByFieldId.get(sourceSchemaField._id)
                                                : undefined;
                                        })();

                                    if (!sourceRecord || isEmptyValue(sourceRecord.value)) {
                                        return false;
                                    }
                                    return true;
                                });

                                // An instance left with only hidden/control
                                // fields renders nothing useful — skip it.
                                if (visibleFields.length === 0) return null;

                                return (
                                    <Fragment key={idx}>
                                        {showInstanceTitle && (
                                            <Title level={5} style={{ marginTop: 16 }}>
                                                Item {idx + 1}
                                            </Title>
                                        )}
                                        <Descriptions
                                            key={idx}
                                            column={1}
                                            bordered={false}
                                            size="middle"
                                            className="mt-4"
                                            labelStyle={{
                                                fontWeight: 500,
                                                width: '40%',
                                            }}
                                            contentStyle={{ color: '#555' }}
                                        >
                                            {visibleFields.map((f: any) => {
                                                const schema = fieldMap.get(f.field);
                                                const label =
                                                    schema?.label ||
                                                    f.label ||
                                                    schema?.name ||
                                                    f.field;

                                                return (
                                                    <Descriptions.Item
                                                        key={f._id || f.field}
                                                        label={label}
                                                    >
                                                        {renderFieldValue(
                                                            schema,
                                                            f.value,
                                                            countryOptions,
                                                            f.type
                                                        )}
                                                    </Descriptions.Item>
                                                );
                                            })}
                                        </Descriptions>
                                    </Fragment>
                                );
                            })}
                        </Fragment>
                    );
                })}
            </Card>
        </Row>
    );
}
