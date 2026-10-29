import { lazy } from 'react';

const LandingPage = lazy(() => import('@src/domains/dashboard/legalService/pages/LandingPage'));
const BrowseTemplates = lazy(() => import('@src/domains/dashboard/legalService/pages/BrowseTemplates'));
const DocumentPage = lazy(() => import('@src/domains/dashboard/legalService/pages/DocumentPage'));
const SendForSignaturePage = lazy(() => import('@src/domains/dashboard/legalService/pages/SendForSignaturePage'));
const DocumentDetailPage = lazy(() => import('@src/domains/dashboard/legalService/pages/DocumentDetailPage'));
const PersonalDocumentPage = lazy(() => import('@src/domains/dashboard/legalService/pages/PersonalDocumentPage'));

export const legalServiceRoutes = [
    { element: <LandingPage />, index: true },
    { element: <BrowseTemplates />, path: 'browse-templates' },
    { element: <DocumentPage />, path: 'document/:templateId' },
    { element: <SendForSignaturePage />, path: 'document/:documentId/send-for-esign' },
    { element: <DocumentDetailPage />, path: 'document/:documentId/details' },
    { element: <PersonalDocumentPage />, path: 'personal-document/:templateId' },
];
