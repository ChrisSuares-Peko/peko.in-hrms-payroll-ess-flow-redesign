import React from 'react';

import { Button } from 'antd';
import { Formik, Form } from 'formik';

import DocumentUploadSection from './DocumentUploadSection';
import FilingDetailsSection from './FilingDetailsSection';
import { inc20aInitialValues } from './inc20aInitialValues';
import { inc20aSchema } from './inc20aSchema';
import { INC20AFormValues, INC20ASubmitProps } from './inc20aTypes';
import AuthorisedSignatorySection from '../ComplianceShared/AuthorisedSignatorySection';
import CompanyDetailsSection from '../ComplianceShared/CompanyDetailsSection';
import DeclarationSection from '../ComplianceShared/DeclarationSection';
import DirectorsSection from '../ComplianceShared/DirectorsSection';
import OfficeUseSection from '../ComplianceShared/OfficeUseSection';
import ShareholdersSection from '../ComplianceShared/ShareholdersSection';

const DOC_KEYS: (keyof INC20AFormValues)[] = [
  'doc_bankStatement',
  'doc_boardResolution',
  'doc_officeExterior',
  'doc_officeInterior',
  'doc_coi',
  'doc_moaAoa',
  'doc_sectoralApproval',
];

const INC20AForm: React.FC<INC20ASubmitProps> = ({ onSubmit }) => {
  const handleSubmit = async (values: INC20AFormValues) => {
    const companyInfo: Record<string, string> = {};
    const documents: { key: string; base64: string; fileName: string }[] = [];

    Object.entries(values).forEach(([key, value]) => {
      if (DOC_KEYS.includes(key as keyof INC20AFormValues)) {
        // Skip — handled separately below
        return;
      }

      if (Array.isArray(value)) {
        companyInfo[key] = JSON.stringify(value);
      } else if (typeof value === 'boolean') {
        companyInfo[key] = String(value);
      } else {
        companyInfo[key] = value ?? '';
      }
    });

    // Extract document fields
    DOC_KEYS.forEach((key) => {
      const raw = values[key] as string;
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            parsed.forEach((doc: { base64: string; fileName: string }, idx: number) => {
              documents.push({ key: `${key}_${idx}`, base64: doc.base64, fileName: doc.fileName });
            });
          } else {
            documents.push({ key, base64: parsed.base64, fileName: parsed.fileName });
          }
        } catch {
          // raw string value — store as-is
          documents.push({ key, base64: raw, fileName: key });
        }
      }
    });

    await onSubmit({ companyInfo, documents });
  };

  return (
    <Formik<INC20AFormValues>
      initialValues={inc20aInitialValues}
      validationSchema={inc20aSchema}
      onSubmit={handleSubmit}
      validateOnChange={false}
      validateOnBlur={false}
      initialTouched={Object.keys(inc20aInitialValues).reduce<Record<string, boolean>>((acc, k) => { acc[k] = true; return acc; }, {})}
      validateOnMount={false}
      enableReinitialize
    >
      {({ isSubmitting, setTouched, values, submitForm }) => (
        <Form>
          <OfficeUseSection />

          <CompanyDetailsSection />

          <DirectorsSection fieldName="inc20a_directors" />

          <ShareholdersSection fieldName="inc20a_shareholders" />

          <AuthorisedSignatorySection fieldName="inc20a_signatories" />

          <FilingDetailsSection />

          <DocumentUploadSection />

          <DeclarationSection />

          <div className="flex justify-end mt-6">
            <Button
              type="primary"
              loading={isSubmitting}
              size="large"
              style={{ backgroundColor: '#ff4f4f', borderColor: '#ff4f4f' }}
              onClick={async () => {
                const allTouched = Object.keys(values).reduce<Record<string, boolean>>((acc, k) => { acc[k] = true; return acc; }, {});
                await setTouched(allTouched, false);
                submitForm();
              }}
            >
              Submit INC-20A
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default INC20AForm;
