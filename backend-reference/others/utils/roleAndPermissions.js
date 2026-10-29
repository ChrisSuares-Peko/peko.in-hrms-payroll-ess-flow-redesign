// eslint-disable-next-line no-unused-vars
const MOCK_SERVICE = [
    {
        serviceCategory: 'Dashboard',
        hasAccess: false,
        services: [],
    },
    {
        serviceCategory: 'Users',
        hasAccess: false,
        services: [
            {
                service: 'Corporate Users',
                hasAccess: false,
            },
            {
                service: 'System Users',
                hasAccess: false,
            },
            {
                service: 'Roles',
                hasAccess: false,
            },
            {
                service: "Pending Sign-ups",
                hasAccess: false,
            }
        ],
    },
    {
        serviceCategory: "Accounts",
        hasAccess: false,
        services: [
            {
                service: "Self Transfer",
                hasAccess: false
            },
            {
                service: "Transfer Funds",
                hasAccess: false
            },
            {
                service: "Create Transactions",
                hasAccess: false
            },
            {
                service: "Wallet Report",
                hasAccess: false
            },
        ]
    },
    {
        serviceCategory: "Need Help",
        hasAccess: false,
        services: []
    },
    {
        serviceCategory: "Reports",
        hasAccess: false,
        services: [
            {
                service: "Subscriptions",
                hasAccess: false,
            },
            {
                service: "Vendors",
                hasAccess: false,
            },
            {
                service: "Corporate",
                hasAccess: false,
            },
            {
                service: "Connection Requests",
                hasAccess: false,
            },
            {
                service: "Workspace Orders",
                hasAccess: false,
            },
            {
                service: "Software Orders",
                hasAccess: false,
            },
            {
                service: "Orders",
                hasAccess: false,
            },
            {
                service: "eSIM",
                hasAccess: false,
            },
            {
                service: "Peko Works",
                hasAccess: false,
            },
            {
                service: "Attestations",
                hasAccess: false,
            },
            {
                service: "Airline Cancellation",
                hasAccess: false,
            },
            {
                service: "Airline Modification",
                hasAccess: false,
            },
            {
                service: "Bus Tickets",
                hasAccess: false,
            },
            {
                service: "Scheduling Reports",
                hasAccess: false
            },
            {
                service: "Payment Links",
                hasAccess: false,
            },
            {
                service: "Transaction Report",
                hasAccess: false,
            },
            {
              service: "Subscription Renewals",
              hasAccess: false,
            },
            {
              service: "Domain & Hosting Refunds",
              hasAccess: false,
            },
            {
              service: "Subscription Renewals",
              hasAccess: false,
            },
            {
              service: "Subscription Renewal Charges",
              hasAccess: false,
            },
          ],
    },
    {
        serviceCategory: "Office Supplies",
        hasAccess: false,
        services: [
            {
                service: "Orders",
                hasAccess: false
            },
            {
                service: 'Product',
                hasAccess: false,
            },
        ]
    },
    {
        serviceCategory: "Announcements",
        hasAccess: false,
        services: [
            {
                service: "Notifications",
                hasAccess: false
            }
        ]
    },
    {
        serviceCategory: "Settings",
        hasAccess: false,
        services: [
            {
                service: "Vendors",
                hasAccess: false,
            },
            {
                service: "Service Operators",
                hasAccess: false,
            },
            {
                service: "Packages",
                hasAccess: false,
            },
            {
                service: "Service Packages",
                hasAccess: false,
            },
            {
                service: "Cashback",
                hasAccess: false,
            },
            {
                service: "Subscription Codes",
                hasAccess: false,
            },
            {
                service: "Disable Service",
                hasAccess: false,
            },
            {
                service: "Banners",
                hasAccess: false,
            },

            {
                service: "Categories",
                hasAccess: false,
            },
            {
                service: "Referral Code",
                hasAccess: false,
            },
            {
                service: "Voucher",
                hasAccess: false,
            },
            {
                service: "Partner Permissions",
                hasAccess: false,
            },
            {
                service: "Coupon Code",
                hasAccess: false,
            },
            {
                service: "Peko WhatsApp Numbers",
                hasAccess: false
            },
            {
                service: "Invoice Templates",
                hasAccess: false
            },
            {
                service: "Service Rule",
                hasAccess: false
            },
            // {
            //   service: "Access Code",
            //   hasAccess: false,
            // },
            {
                service: "IP Whitelist",
                hasAccess: false,
            },
            {
                service: "Branding",
                hasAccess: false,
            },
            {
                service: "Subscription Reminders",
                hasAccess: false,
            },
        ],
    },
    {
        serviceCategory: "Manage",
        hasAccess: false,
        services: [
            {
                service: "Software Products",
                hasAccess: false,
            },
            {
                service: "Software Plans",
                hasAccess: false,
            },
            {
                service: "Office Address",
                hasAccess: false,
            },
            {
                service: "Workspaces",
                hasAccess: false,
            },
            {
                service: "Corporate Tax Registration",
                hasAccess: false,
            },
            {
                service: "Peko Works",
                hasAccess: false,
            },
            {
                service: "Work Plans",
                hasAccess: false,
            },
            {
                service: "Gift Cards",
                hasAccess: false,
            },
            {
                service: "Connect",
                hasAccess: false,
            },
            {
                service: "E-Docs",
                hasAccess: false,
            },
            {
                service: "Vendor Payout",
                hasAccess: false,
            },
            {
                service: "Business Emails",
                hasAccess: false
            },
            {
                service: "Business Emails Plans",
                hasAccess: false,
            },
            {
              service: "Domain & Hosting Plans",
              hasAccess: false,
            },
            {
              service: "Domain TLDs",
              hasAccess: false,
            },
            {
                service: "Hike",
                hasAccess: false,
            },
            {
                service: "eSIM Plans",
                hasAccess: false,
            },
            {
                service: "Collector KYB",
                hasAccess: false
            },
            {
                service: "Compliance",
                hasAccess: false,
            },
            {
                service: "Payout Onboarding",
                hasAccess: true,
            },
        ],
    },
    {
        serviceCategory: "Profile",
        hasAccess: false,
        services: [],
    },
    {
        serviceCategory: "Payroll",
        hasAccess: false,
        services: [],
    },
    {
        services: [
            {
                service: "Password Policy",
                hasAccess: true
            },
            {
                service: "Password Protection",
                hasAccess: true
            },
            {
                service: "Application Policy",
                hasAccess: true
            },
            {
                service: "Settings Manager",
                hasAccess: false
            }
        ],
        hasAccess: true,
        serviceCategory: "System Configuration"
    },
]

const MOCK_CATEGORIZED_SERVICE =
[
    {
        "services": [],
        "hasAccess": false,
        "serviceCategory": "Dashboard"
    },
    {
        "services": [
            {
                "category": "Corporate",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Corporate Users",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": true,
                        "update": true,
                        "service": "Corporate Lookup",
                        "hasAccess": true
                    },
                    {
                        "view": false,
                        "write": true,
                        "update": true,
                        "service": "Corporate Card Lookup",
                        "hasAccess": true
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Partner User",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Partners",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Partner Permissions",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Partner Services",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
             {
                "category": "Service Access Configuration",
                "services": [
                    {
                        "view": false,
                        "write": true,
                        "update": true,
                        "service": "Corporate User Configuration",
                        "hasAccess": true
                    },
                    {
                        "view": false,
                        "write": true,
                        "update": true,
                        "service": "System User Configuration",
                        "hasAccess": true
                    }
                ],
                "hasAccess": true
            },
            {
                "category": "System User",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "System Users",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Roles",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "Users"
    },
    {
        "services": [
            {
                "category": "General",
                "services": [
                    {
                        "view": false,
                        "update": false,
                        "service": "Create Transaction",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Self Transfer",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Transfer Funds",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Bulk Refund",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "Accounts"
    },
    {
        "services": [
            {
                "category": "General",
                "services": [
                    {
                        "view": false,
                        "service": "Tickets",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "Need Help"
    },
    {
        "services": [
            {
                "category": "General",
                "services": [
                    {
                        "view": false,
                        "service": "Subscriptions",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Vendors",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Corporate",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Payment Links",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Transaction Report",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Order Journals",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Connection Requests",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Scheduling Reports",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Wallet Reports",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Pending Sign-ups",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Subscription Renewals",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Subscription Renewal Charges",
                        "hasAccess": false
                    },
                           {
                        "view": false,
                        "service": "Govt Services Applications",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Global Business Setup Applications",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Global Business Setup Renewals",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Insurance Quote Requests",
                        "hasAccess": false
                    },

                ],
                "hasAccess": false
            },
            {
                "category": "Orders",
                "services": [
                    {
                        "view": false,
                        "update": false,
                        "service": "Workspace Orders",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Software Orders",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Orders",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Peko Works",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Attestations",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Domain & Hosting Refunds",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Travel",
                "services": [
                    {
                        "view": false,
                        "update": false,
                        "service": "Airline Cancellation",
                        "hasAccess": false
                    },
                    // {
                    //     "view": false,
                    //     "update": false,
                    //     "service": "Airline Modification",
                    //     "hasAccess": false
                    // },
                    {
                        "view": false,
                        "service": "eSIM",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Bus Tickets",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "WhatsApp for Business",
                "services": [
                    {
                        "service": "Add ons",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Corporate Cards",
                "services": [
                    {
                        "view": false,
                        "service": "Transactions",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "Reports"
    },
    {
        "services": [
            {
                "category": "General",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Vendors",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Subscription Codes",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Banners",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Categories",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Referral Code",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Coupon Code",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Invoice Templates",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Email Templates",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Branding",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "IP Whitelist",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": true,
                        "update": true,
                        "service": "Peko Credits",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Peko WhatsApp Numbers",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Subscription Reminders",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": true,
                        "update": true,
                        "service": "COA Rules",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": true,
                        "update": true,
                        "service": "Chart of Accounts",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": true,
                        "update": true,
                        "service": "Internal Purchase Accounts",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Services",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Service Operators",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Packages",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Cashback",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Disable Services",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Service Packages",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Business Registration Catalog",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Service Classification",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Accounting Approvals",
                        "hasAccess": false
                    },
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "Settings"
    },
    {
        "services": [
            {
                "category": "General",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Attestation",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Bill Payments",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Airline Airports",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Mswipe Refunds",
                        "hasAccess": false
                    },
                    {
                        "service": "Collector Kyb",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Business Registration",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Corporate Tax Registration",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Logistics Corporate",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "eSIM Plans",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Payment Links",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Vendor Payout",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Gift Cards",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Connect",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Business Docs",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Hike",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Notifications",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Government Services",
                        "hasAccess": false
                        },
                        {
                            "view": false,
                            "update": false,
                            "service": "Compliance",
                            "hasAccess": false
                        },
                    {
                        "view": true,
                        "update": true,
                        "service": "Payout Onboarding",
                        "hasAccess": true
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Mobile Recharge Providers",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Office Supplies",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Products",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Orders",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Softwares",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Software Products",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Software Plans",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Legal Services",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Legal Templates",
                        "hasAccess": false
                    },
                ],
                "hasAccess": false
            },
            {
                "category": "Office Address",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Office Address",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Workspaces",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Works",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Peko Works",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Work Plans",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Business",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Business Emails",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Business Emails Plans",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Domain & Hosting Plans",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Car Report Plans",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Domain TLDs",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Domain & Hosting",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Corporate Cards",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Applications",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Termination Requests",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Account Closure Requests",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Document Size Limits",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "Manage"
    },
    {
        "services": [
            {
                "category": "Operations",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Order Journals",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Wallet Journals",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Service without plans",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Service with plans",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Peko Subscriptions",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Whitelabel Partners",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Chart of Accounts",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Internal Purchase Accounts",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Third Party Configuration",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Ledgers",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Vendors",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Subscribers",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Partners",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Payment Gateways",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            },
            {
                "category": "Others",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Approvals",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "Manual Operations",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "Audit Trail",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "service": "FAQ",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "Accounting"
    },
    {
        "services": [
            {
                "category": "General",
                "services": [
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "GST Filing",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "write": false,
                        "update": false,
                        "service": "TDS Filing",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "Tax & More"
    },
    {
        "services": [],
        "hasAccess": false,
        "serviceCategory": "Profile"
    },
    {
        "services": [
            {
                "category": "General",
                "services": [
                    {
                        "view": false,
                        "update": false,
                        "service": "Password Policy",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Password Protection",
                        "hasAccess": false
                    },
                    {
                        "view": false,
                        "update": false,
                        "service": "Settings Manager",
                        "hasAccess": false
                    }
                ],
                "hasAccess": false
            }
        ],
        "hasAccess": false,
        "serviceCategory": "System Configuration"
    }
]


module.exports = MOCK_CATEGORIZED_SERVICE;
