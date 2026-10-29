import React from 'react';

import { Breadcrumb, Typography } from 'antd';
import { FiChevronRight } from 'react-icons/fi';
import { useLocation, Link } from 'react-router-dom';

import { useAppSelector } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

type BreadCrumbProps = object;

const CustomBreadCrumb: React.FC<BreadCrumbProps> = () => {
    const location = useLocation();
    const servicesList = useAppSelector(state => state.reducer.governmentServices.servicesList);
    const selectedService = useAppSelector(
        state => state.reducer.governmentServices.selectedService
    );
    const selectedApplication = useAppSelector(
        state => state.reducer.governmentServices.selectedApplication
    );
    // const { role } = useAppSelector(state => state.reducer.auth);
    const { pathname } = location;
    const pathnames = pathname
        .split('/')
        .filter(item => item)
        .map(item => decodeURIComponent(item));
    const capitalize = (s: string) => {
        if (s === 'complaint-registration') {
            return 'Orders & Complaints';
        }
        if (s === 'sales') {
            return 'SalesX';
        }
        if (s === 'eSign') {
            return s;
        }
        if (s === 'esim') {
            return 'eSIM';
        }
        if (s === 'e-invoicing') {
            return 'E-Invoice';
        }
        if (s === 'add-ons') {
            return 'Add ons';
        }
        if (s === 'invoices' && pathnames[0] === paths.invoice.index) {
            return 'Invoicing';
        }
        if (s === 'eSIM') return s;
        if (s === 'esim-plans') {
            return 'eSIM Plans';
        }
        if (s === 'ip-whitelist') {
            return 'IP Whitelist';
        }
        if (s === 'ncmc') {
            return 'NCMC';
        }
        if (s === 'nps') {
            return 'NPS';
        }
        if (s === 'ims') {
            return 'IMS';
        }
        if (s === 'ctc-calculator') {
            return 'CTC Calculator';
        }
        if (s === 'gstr-2b') {
            return 'GSTR 2B';
        }
        if (s === 'file-gstr3b') {
            return 'GSTR-3B';
        }
        if (s === 'file-gstr9') {
            return 'GSTR-9';
        }
        if (s === 'clubs-associations') {
            return 'Clubs & Associations';
        }
        if (s === 'hospital-pathology') {
            return 'Hospital & Pathology';
        }
        if (s === 'lpg-cylinder') {
            return 'LPG Cylinder';
        }
        if (s === 'dth-recharge') {
            return 'DTH Recharge';
        }
        if (s === 'fastag') {
            return 'FASTag';
        }
        if (s === 'orders') {
            if (pathname.includes('/corporate-travel/eSIM/')) return 'Order History';
        }
        if (s === 'modify-or-cancel-booking') {
            return 'Modify/Cancel Booking';
        }
        if (s === 'booking-confirmed') {
            return 'Ticket Details';
        }
        if (s === 'manage-bookings' && pathname.includes('/visa/')) {
            return 'Track Visa Status';
        }
        if (s === 'timesheet') {
            return 'Attendance';
        }
        if (s === 'timesheet') {
            return 'Attendance';
        }
        if (s === 'salary-past-employees') {
            return 'Past Employees';
        }
        if (s === 'salary-employees') {
            return 'Active Employees';
        }
        if (s === 'payroll-history-view') {
            return 'Salary History Details';
        }
        if (s === 'rfq') {
            return 'RFQ';
        }
        if (s === 'procure') {
            return 'Procure';
        }
        if (s === 'peko-pos') {
            return 'Peko POS';
        }
        if (s === 'apply' && pathname.includes('business-registration')) {
            return 'Business Registration';
        }
        // Business Registration entity slugs — the generic title-case mangles the
        // acronyms (llp→Llp, opc→Opc) and the underscore in private_limited.
        if (pathname.includes('business-registration')) {
            const brEntity: Record<string, string> = {
                llp: 'LLP',
                opc: 'OPC',
                private_limited: 'Private Limited',
                proprietorship: 'Proprietorship',
                partnership: 'Partnership',
            };
            if (brEntity[s]) return brEntity[s];
        }
        if (s === 'health' && pathname.includes('/compliance/')) {
            return 'Compliance Health';
        }
        if (s === 'file-gstr1') return 'GSTR 1';
        if (s === 'file-gstr3b') return 'GSTR 3B';
        if (s === 'gst-filing') return 'Gst Filing';
        if (s === 'gst-ledger') return 'Gst Ledger';
        if (s === 'filing-history') return 'Filing History';
        if (s === 'supplier-compliance') return 'Supplier Compliance';
        if (s === 'gstin-lookup') return 'Verify GSTIN';
        if (s === 'prepaid' && pathname.includes('mobile-recharge')) {
            return 'Mobile Prepaid';
        }
        if (s === 'legal-service') {
            return 'Legal Service';
        }
        // Return procurement reference numbers as-is (e.g. PO-2026-001, RFQ-2026-001, PR-2026-001)
        if (/^(PO|RFQ|PR|INV)-\d{4}-\d{3,}$/.test(s)) {
            return s;
        }
        return s
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    // paths that need a virtual parent crumb injected (URL doesn't reflect the navigation hierarchy)
    const virtualParents: Record<string, { label: string; path: string }> = {
        '/tax-more/ims': { label: 'Gst Filing', path: '/tax-more/gst-filing' },
        '/tax-more/gstr-2b': { label: 'Gst Filing', path: '/tax-more/gst-filing' },
        '/tax-more/gst-ledger': { label: 'Gst Filing', path: '/tax-more/gst-filing' },
        '/tax-more/supplier-compliance': { label: 'Gst Filing', path: '/tax-more/gst-filing' },
        '/tax-more/gstin-lookup': { label: 'Gst Filing', path: '/tax-more/gst-filing' },
        '/tax-more/filing-history': { label: 'Gst Filing', path: '/tax-more/gst-filing' },
        '/corporate-travel/bus/booking-confirmed': {
            label: 'Manage Bookings',
            path: '/corporate-travel/bus/manage-bookings',
        },
    };

    const nestedRoutes = [
        'details',
        'product-details',
        'order-details',
        'project-details',
        'purchase',
        'invoice-details',
        'sales-order-details',
        'quotation-details',
        'e-invoice-details',
        'edit-invoice',
        // 'wallet-history',
    ];

    const blackListedRoutes = [
        'payment-success',
        'payment-failure',
        'payment-pending',
        // role !== 'system_user' && 'peko-wallet',
        'payments',
        'ccavenue-processing',
        'mswipe-processing',
        'hotels',
        'airline',
        'bus',
        'system-user',
        'plans',
        'review-order',
        'contact-us',
        'topup-success',
        'kyc',
        'explore',
    ];

    // Single-segment service routes that need a "More Services" parent crumb
    // Note: turbo, logistics, whatsappForBusiness are now direct sidebar items — removed from here
    const moreServicesLandingPages: Record<string, string> = {
        // [paths.turbo.index]: 'Turbo',
        // [paths.whatsappForBusiness.index]: 'WhatsApp for Business',
        [paths.domainHosting.index]: 'Domain & Hosting',
        // [paths.logistics.index]: 'Logistics',
    };

    const salaryRolloutItem = {
        key: 'salary-rollout',
        title: (
            <Link to={`/${paths.payroll.index}/${paths.payroll.salaryDashboard}`}>
                <Typography.Text className="font-normal text-sm text-[#667085]">
                    Salary Dashboard
                </Typography.Text>
            </Link>
        ),
    };

    const salaryHistoryLinkItem = {
        key: 'salary-history-link',
        title: (
            <Link to={`/${paths.payroll.index}/${paths.payroll.salaryHistory}`}>
                <Typography.Text className="font-normal text-sm text-[#667085]">
                    Salary History
                </Typography.Text>
            </Link>
        ),
    };

    const employeesSalaryLinkItem = {
        key: 'employees-salary-link',
        title: (
            <Link to={`/${paths.payroll.index}/${paths.payroll.employeesSalary}`}>
                <Typography.Text className="font-normal text-sm text-[#667085]">
                    Employees Salary
                </Typography.Text>
            </Link>
        ),
    };

    const payrollHistoryTabLinkItem = {
        key: 'payroll-history-tab-link',
        title: (
            <Link
                to={`/${paths.payroll.index}/${paths.payroll.employeesSalary}`}
                state={{ activeTab: '2' }}
            >
                <Typography.Text className="font-normal text-sm text-[#667085]">
                    Payroll History
                </Typography.Text>
            </Link>
        ),
    };

    const navState = location.state as {
        proposalId?: string;
        rfqId?: string;
        invoiceNumber?: string;
    } | null;

    const extraBreadcrumbItems: any = pathnames
        .flatMap((name, index) => {
            if (
                pathnames[0] === paths.officeSupplies.index &&
                pathnames[1] === paths.officeSupplies.productDetails &&
                index === 2
            ) {
                return { title: '', key: '' };
            }
            const isIndexLast = index + 1 === pathnames.length - 1;
            let routeTo = `/${pathnames.slice(0, index + 1).join('/')}`;
            if (nestedRoutes.includes(name) && isIndexLast) {
                const crumb = {
                    key: name,
                    title: (
                        <Typography.Text className=" font-normal text-sm text-[#FF9B9B]">
                            {capitalize(name)}
                        </Typography.Text>
                    ),
                };
                if (name === 'quotation-details') {
                    const quotationListingPath =
                        pathnames[0] === paths.sales.index
                            ? `/${paths.sales.index}/${paths.sales.quotations}`
                            : `/${paths.invoice.index}/${paths.invoice.quotations}`;
                    return [
                        {
                            key: 'quotation-listing',
                            title: (
                                <Link to={quotationListingPath}>
                                    <Typography.Text className=" font-normal text-sm text-[#667085]">
                                        Quotation Listing
                                    </Typography.Text>
                                </Link>
                            ),
                        },
                        crumb,
                    ];
                }
                if (name === 'invoice-details') {
                    if (
                        pathnames.includes('all-invoices') ||
                        pathnames.includes('invoice-listing')
                    ) {
                        return crumb;
                    }
                    const invoiceListingPath =
                        pathnames[0] === paths.sales.index
                            ? `/${paths.sales.index}/${paths.sales.invoices}`
                            : `/${paths.invoice.index}/${paths.invoice.allInvoice}`;
                    return [
                        {
                            key: 'invoice-listing',
                            title: (
                                <Link to={invoiceListingPath}>
                                    <Typography.Text className=" font-normal text-sm text-[#667085]">
                                        Invoice Listing
                                    </Typography.Text>
                                </Link>
                            ),
                        },
                        crumb,
                    ];
                }
                return crumb;
            }
            if (nestedRoutes.includes(name) && !isIndexLast) {
                routeTo = `/${pathnames.slice(0, index + 2).join('/')}`;
                return {
                    key: name,
                    title: (
                        <Link to={routeTo}>
                            <Typography.Text className=" font-normal text-sm text-[#667085]">
                                {capitalize(name)}
                            </Typography.Text>
                        </Link>
                    ),
                };
            }

            const lastIndex = pathnames.length - 1;

            const lastIsObjectId = /^[a-f\d]{24}$/i.test(pathnames[lastIndex]);

            // Treat the second-to-last segment as "last" (non-clickable) when
            // the final segment is a Mongo ObjectId — those parent stubs
            // (e.g. `.../edit-application` before `:id`) have no standalone
            // route, so linking them would 404. Mirrors AE pekoStart fix.
            const isLast =
                index === pathnames.length - 1 ||
                (lastIsObjectId && index === pathnames.length - 2);

            // Check if it's a UUID (more accurate check)
            const isUUID = parseInt(name, 10) > 0;

            // If the next segment is a dynamic ID, this segment has no standalone route
            const nextIsId = index + 1 < pathnames.length && parseInt(pathnames[index + 1], 10) > 0;

            // if ((isLast && isUUID) || pathnames.length === 1) {
            //     return { title: '', key: '' };
            // }
            if (isUUID) {
                // Show "View Proposal" for the proposals detail route
                if (pathname.match(/\/proposals\/\d+/) && isLast) {
                    return {
                        title: (
                            <Typography.Text className=" font-normal text-sm text-[#FF9B9B]">
                                View
                            </Typography.Text>
                        ),
                        key: name,
                    };
                }
                // Show "View Purchase Order" for the purchase-orders detail route
                if (pathname.match(/\/purchase-orders\/\d+/) && isLast) {
                    return {
                        title: (
                            <Typography.Text className=" font-normal text-sm text-[#FF9B9B]">
                                View
                            </Typography.Text>
                        ),
                        key: name,
                    };
                }
                // Show "View Purchase Request" for the purchase-requests detail route
                if (pathname.match(/\/purchase-requests\/\d+/) && isLast) {
                    return {
                        title: (
                            <Typography.Text className=" font-normal text-sm text-[#FF9B9B]">
                                View
                            </Typography.Text>
                        ),
                        key: name,
                    };
                }
                // Show "View RFQ" for the RFQ detail route
                if (pathname.match(/\/rfq\/\d+/) && isLast) {
                    return {
                        title: (
                            <Typography.Text className=" font-normal text-sm text-[#FF9B9B]">
                                View
                            </Typography.Text>
                        ),
                        key: name,
                    };
                }
                // Show invoice ID in breadcrumb for invoicing detail route
                if (pathname.includes('/procure/invoices/') && isLast) {
                    return {
                        title: (
                            <Typography.Text className=" font-normal text-sm text-[#667085]">
                                {navState?.invoiceNumber ?? `Inv-${name}`}
                            </Typography.Text>
                        ),
                        key: name,
                    };
                }
                return { title: '', key: '' };
            }
            // Render "More Services > {service}" for these landing pages
            if (pathnames.length === 1 && moreServicesLandingPages[name]) {
                return [
                    {
                        key: 'more-services',
                        title: (
                            <Link to={paths.dashboard.moreServices}>
                                <Typography.Text className=" font-normal text-sm text-[#667085]">
                                    More Services
                                </Typography.Text>
                            </Link>
                        ),
                    },
                    {
                        key: name,
                        title: (
                            <Typography.Text className=" font-normal text-sm text-[#FF9B9B]">
                                {moreServicesLandingPages[name]}
                            </Typography.Text>
                        ),
                    },
                ];
            }
            if (pathnames.length === 1 || blackListedRoutes.includes(name)) {
                return { title: '', key: '' };
            }

            if (name === 'compliance' && pathnames[index + 1] === 'dashboard') {
                return { title: '', key: '' };
            }

            // Business Registration: collapse the /apply step so the breadcrumb reads
            // "More Services > Business Registration" (apply becomes the active crumb).
            if (name === 'business-registration' && pathnames[index + 1] === 'apply') {
                return { title: '', key: '' };
            }

            // Hide "procure" and the first "dashboard" parent segment for procure routes
            if (name === 'procure' && pathnames[index + 1] === 'dashboard') {
                return { title: '', key: '' };
            }
            if (name === 'dashboard' && pathnames[index - 1] === 'procure') {
                return { title: '', key: '' };
            }

            // For government-services/application/:id, show the actual service name as the active last crumb (no link — ID-only route)
            if (
                name === 'application' &&
                pathnames[index + 1] &&
                parseInt(pathnames[index + 1], 10) > 0 &&
                pathnames.includes('government-services')
            ) {
                const applicationId = parseInt(pathnames[index + 1], 10);
                const application =
                    selectedApplication?.id === applicationId ? selectedApplication : undefined;
                const serviceName = application
                    ? servicesList.find(s => s.accessKey === application.service)?.name
                    : undefined;
                return {
                    key: name,
                    title: (
                        <Typography.Text className="font-normal text-sm text-[#FF9B9B]">
                            {serviceName ?? 'Application'}
                        </Typography.Text>
                    ),
                };
            }

            // For government-services/service/:id, replace 'service' with the actual service name
            // (no separate "Explore" crumb — the services list is the government-services landing page itself).
            // Only when service/:id is the route's own last segment, though — sub-pages nested under it
            // (e.g. .../service/:id/register, /apply, /success) already have their own last crumb for that
            // step, and showing the ServiceDetail-level service name crumb in front of it too is redundant
            // (that page isn't part of the navigation path to get here, it's just where :id happened to
            // resolve from).
            if (
                name === 'service' &&
                pathnames[index + 1] &&
                parseInt(pathnames[index + 1], 10) > 0 &&
                pathnames.includes('government-services') &&
                pathnames[index + 2] === undefined
            ) {
                const serviceId = parseInt(pathnames[index + 1], 10);
                const fromList = servicesList.find(s => s.id === serviceId)?.name;
                const fromSelected =
                    selectedService?.id === serviceId ? selectedService.name : undefined;
                const serviceName = fromList ?? fromSelected ?? 'Service';
                const serviceRoute = `/${pathnames.slice(0, index + 2).join('/')}`;
                const labelStyle = isLast ? 'text-[#FF9B9B]' : 'text-[#667085]';
                return {
                    key: name,
                    title: isLast ? (
                        <Typography.Text className={`font-normal text-sm ${labelStyle}`}>
                            {serviceName}
                        </Typography.Text>
                    ) : (
                        <Link to={serviceRoute}>
                            <Typography.Text className={`font-normal text-sm ${labelStyle}`}>
                                {serviceName}
                            </Typography.Text>
                        </Link>
                    ),
                };
            }
            // service/:id when a sub-page follows it (see above) — the bare numeric id is
            // already hidden by the isUUID branch; this segment becomes an "Applications" crumb
            // instead of the word "service", since every one of these sub-pages (register,
            // objection, apply, success) is a step in an application that lives on that list.
            if (
                name === 'service' &&
                pathnames.includes('government-services') &&
                pathnames[index + 2] !== undefined
            ) {
                return {
                    key: 'gov-services-applications',
                    title: (
                        <Link
                            to={`${paths.dashboard.governmentServices}/${paths.governmentServices.applications}`}
                        >
                            <Typography.Text className="font-normal text-sm text-[#667085]">
                                Applications
                            </Typography.Text>
                        </Link>
                    ),
                };
            }

            // Render "compare" as the current page (red, no link) — must be before nextIsId check
            // because the rfqId segment after it would trigger nextIsId and make it a link
            if (name === 'compare') {
                return {
                    key: 'compare',
                    title: (
                        <Typography.Text className=" font-normal text-sm text-[#FF9B9B]">
                            Compare
                        </Typography.Text>
                    ),
                };
            }

            if (name === 'compliance' && pathnames[index + 1] === 'dashboard') {
                return { title: '', key: '' };
            }

            // Hide "procure" and the first "dashboard" parent segment for procure routes
            if (name === 'procure' && pathnames[index + 1] === 'dashboard') {
                return { title: '', key: '' };
            }
            if (name === 'dashboard' && pathnames[index - 1] === 'procure') {
                return { title: '', key: '' };
            }

            if (['document', 'personal-document'].includes(name)) {
                return {
                    title: (
                        <Typography.Text className="font-normal text-sm text-[#667085]">
                            {capitalize(name)}
                        </Typography.Text>
                    ),
                    key: name,
                };
            }

            if (nextIsId) {
                const isCorporateCardApplications =
                    name === paths.manage.corporateCardApplications &&
                    pathnames[index - 1] === 'manage';
                return {
                    title:
                        pathname.includes('/procure/') || isCorporateCardApplications ? (
                            <Link to={routeTo}>
                                <Typography.Text className="font-normal text-sm text-[#667085]">
                                    {capitalize(name)}
                                </Typography.Text>
                            </Link>
                        ) : (
                            <Typography.Text className="font-normal text-sm text-[#667085]">
                                {capitalize(name)}
                            </Typography.Text>
                        ),
                    key: name,
                };
            }
            // On the compare page (/proposals/compare/:rfqId), show context-aware parent:
            // - came from proposals detail (navState.proposalId) → show Proposals
            // - came from RFQ view (no state) → show RFQ
            if (name === 'proposals' && pathnames[index + 1] === 'compare') {
                if (navState?.proposalId) {
                    const proposalsPath = `/${pathnames.slice(0, index + 1).join('/')}`;
                    return {
                        key: 'proposals',
                        title: (
                            <Link to={proposalsPath}>
                                <Typography.Text className=" font-normal text-sm text-[#667085]">
                                    Proposals
                                </Typography.Text>
                            </Link>
                        ),
                    };
                }
                const rfqViewPath = '/procure/rfq';
                return {
                    key: 'rfq-compare-parent',
                    title: (
                        <Link to={rfqViewPath}>
                            <Typography.Text className=" font-normal text-sm text-[#667085]">
                                RFQ
                            </Typography.Text>
                        </Link>
                    ),
                };
            }

            if (isLast && !isUUID) {
                const lastItem = {
                    title: (
                        <Typography.Text className=" font-normal text-sm text-[#FF9B9B]">
                            {capitalize(name)}
                        </Typography.Text>
                    ),
                    key: name,
                };
                if (
                    name === 'salary-past-employees' ||
                    name === 'salary-employees' ||
                    name === paths.payroll.salaryStats ||
                    name === paths.payroll.salaryProcess ||
                    name === paths.payroll.manageBanks
                ) {
                    return [salaryRolloutItem, lastItem];
                }
                if (name === paths.payroll.salaryHistory) {
                    return [salaryRolloutItem, lastItem];
                }
                if (name === paths.payroll.salaryHistoryDetails) {
                    return [salaryRolloutItem, salaryHistoryLinkItem, lastItem];
                }
                if (name === paths.payroll.payrollHistoryView) {
                    return [employeesSalaryLinkItem, payrollHistoryTabLinkItem, lastItem];
                }
                return [lastItem];
            }

            if (name === 'tax-and-more' || name === 'tax-more') {
                return {
                    title: (
                        <Link to={routeTo}>
                            <Typography.Text className=" font-normal text-sm text-[#667085]">
                                Tax & More
                            </Typography.Text>
                        </Link>
                    ),
                    key: name,
                };
            }
            if (name === paths.whatsappForBusiness.index) {
                return {
                    title: (
                        <Link to={routeTo}>
                            <Typography.Text className=" font-normal text-sm text-[#667085]">
                                WhatsApp for Business
                            </Typography.Text>
                        </Link>
                    ),
                    key: name,
                };
            }

            // "Visa Tracking" breadcrumb on detail page should link back to the list
            if (name === 'visa-tracking' && !isLast) {
                const listPath = routeTo.replace(/\/visa-tracking$/, '/manage-bookings');
                return {
                    title: (
                        <Link to={listPath}>
                            <Typography.Text className=" font-normal text-sm text-[#667085]">
                                Visa Tracking
                            </Typography.Text>
                        </Link>
                    ),
                    key: name,
                };
            }

            const item = {
                title: (
                    <Link to={routeTo}>
                        <Typography.Text className=" font-normal text-sm text-[#667085]">
                            {capitalize(name)}
                        </Typography.Text>
                    </Link>
                ),
                key: name,
            };

            if (name === 'salary-past-employees' || name === 'salary-employees') {
                return [salaryRolloutItem, item];
            }

            return [item];
        })
        .flat()
        .filter(item => item.key !== '');

    const virtualParent = virtualParents[pathname];
    if (virtualParent) {
        const insertAt = extraBreadcrumbItems.length - 1;
        extraBreadcrumbItems.splice(insertAt, 0, {
            key: virtualParent.path,
            title: (
                <Link to={virtualParent.path}>
                    <Typography.Text className=" font-normal text-sm text-[#667085]">
                        {virtualParent.label}
                    </Typography.Text>
                </Link>
            ),
        });
    }

    const employeeRootSegment = paths.employee.home.replace(/^\//, '');
    const breadcrumbs = [...extraBreadcrumbItems].filter(
        (item: { key?: string }) =>
            !(pathnames[0] === employeeRootSegment && item.key === employeeRootSegment)
    );

    if (pathname.includes('/proposals/compare') && navState?.proposalId) {
        const viewPath = `/procure/proposals/${navState.proposalId}${navState.rfqId ? `?rfqId=${navState.rfqId}` : ''}`;
        const proposalsIdx = breadcrumbs.findIndex(b => b.key === 'proposals');
        if (proposalsIdx !== -1) {
            breadcrumbs.splice(proposalsIdx + 1, 0, {
                key: 'proposal-view',
                title: (
                    <Link to={viewPath}>
                        <Typography.Text className=" font-normal text-sm text-[#667085]">
                            View Proposal
                        </Typography.Text>
                    </Link>
                ),
            });
        }
    }

    return (
        breadcrumbs.length > 0 && (
            <div id="custom-breadcrumb" className="bg-white">
                <Breadcrumb
                    items={breadcrumbs}
                    separator={
                        <div className="-mx-1 pt-[2px]">
                            <FiChevronRight className="text-base " />
                        </div>
                    }
                    className={` ${extraBreadcrumbItems.length > 0 ? 'mb-4' : 'mb-0'}`}
                />
            </div>
        )
    );
};

export default CustomBreadCrumb;
