const operatorsData = require('./operatorsData.json');

const sidebarData = [
    {
        "label": "Dashboard",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Mobile Recharge & Bills",
        "hasAccess": false,
        "subServices": [
            {
                "label": "Prepaid",
                "accessKey": operatorsData.prepaid.accessKey,
                "hasAccess": false
            },
            {
                "label": "Postpaid",
                "accessKey": operatorsData.postpaid.accessKey,
                "hasAccess": false
            },
            {
                "label": "Test",
                "accessKey": operatorsData.mobileRechargeTest.accessKey,
                "hasAccess": false
            }
        ]
    },
    {
        "label": "Utility Payments",
        "hasAccess": false,
        "subServices": [
            {
                "label": "Electricity Bill",
                "accessKey": operatorsData.electricity.accessKey,
                "hasAccess": false
            },
            {
                "label": "Broadband Bill",
                "accessKey": operatorsData.broadband.accessKey,
                "hasAccess": false
            },
            {
                "label": "LPG Cylinder",
                "accessKey": operatorsData.lpg.accessKey,
                "hasAccess": false
            },
            {
                "label": "Water Bill",
                "accessKey": operatorsData.water.accessKey,
                "hasAccess": false
            },
            {
                "label": "Landline Bill",
                "accessKey": operatorsData.landline.accessKey,
                "hasAccess": false
            },
            {
                "label": "Piped Gas",
                "accessKey": operatorsData.pipedGas.accessKey,
                "hasAccess": false
            },
            {
                "label": "Education Fee",
                "accessKey": operatorsData.education.accessKey,
                "hasAccess": false
            },
            {
                "label": "Insurance",
                "accessKey": operatorsData.billInsurance.accessKey,
                "hasAccess": false
            },
            {
                "label": "Cable Recharge",
                "accessKey": operatorsData.cableRecharge.accessKey,
                "hasAccess": false
            },
            {
                "label": "DTH Recharge",
                "accessKey": operatorsData.dthRecharge.accessKey,
                "hasAccess": false
            },
            {
                "label": "FASTag Recharge",
                "accessKey": operatorsData.fastagRecharge.accessKey,
                "hasAccess": false
            },
            {
                "label": "Traffic Challan",
                "accessKey": operatorsData.challan.accessKey,
                "hasAccess": false
            },
            {
                "label": "Clubs & Associations",
                "accessKey": operatorsData.clubsAssociations.accessKey,
                "hasAccess": false
            },
            {
                "label": "Hospital & Pathology",
                "accessKey": operatorsData.hospitalPathology.accessKey,
                "hasAccess": false
            },
            {
                "label": "Subscription",
                "accessKey": operatorsData.bbpsSubscription.accessKey,
                "hasAccess": false
            },
            {
                "label": "NCMC",
                "accessKey": operatorsData.ncmc.accessKey,
                "hasAccess": false
            },
            {
                "label": "NPS",
                "accessKey": operatorsData.nps.accessKey,
                "hasAccess": false
            },
            {
                "label": "Prepaid Meter",
                "accessKey": operatorsData.prepaidMeter.accessKey,
                "hasAccess": false
            },
            {
                "label": "Life Insurance",
                "accessKey": operatorsData.lifeInsurance.accessKey,
                "hasAccess": false
            },
            {
                "label": "Bike Insurance",
                "accessKey": operatorsData.bikeInsurance.accessKey,
                "hasAccess": false
            },
            {
                "label": "Car Insurance",
                "accessKey": operatorsData.carInsurance.accessKey,
                "hasAccess": false
            },
            {
                "label": "Credit Card Payment",
                "accessKey": operatorsData.creditCard.accessKey,
                "hasAccess": false
            },
            {
                "label": "Loan Repayment",
                "accessKey": operatorsData.loanRepayment.accessKey,
                "hasAccess": false
            },
            {
                "label": "Municipal Taxes",
                "accessKey": operatorsData.municipalTaxes.accessKey,
                "hasAccess": false
            },
            {
                "label": "Municipal Services",
                "accessKey": operatorsData.municipalServices.accessKey,
                "hasAccess": false
            },
            {
                "label": "Recurring Deposite",
                "accessKey": operatorsData.recurringDeposit.accessKey,
                "hasAccess": false
            },
            {
                "label": "Rental",
                "accessKey": operatorsData.rental.accessKey,
                "hasAccess": false
            },
            {
                "label": "Donations",
                "accessKey": operatorsData.donations.accessKey,
                "hasAccess": false
            },
            {
                "label": "Housing Society",
                "accessKey": operatorsData.housingSociety.accessKey,
                "hasAccess": false
            },
            {
                "label": "Complaint Registration",
                "accessKey": operatorsData.complaintRegistration.accessKey,
                "hasAccess": false
            }
        ]
    },
    {
        "label": "Corporate Travel",
        "hasAccess": false,
        "subServices": [
            {
                "label": "airline",
                "accessKey": operatorsData.flight.accessKey,
                "hasAccess": false
            },
            {
                "label": "hotels",
                "accessKey": operatorsData.hotel.accessKey,
                "hasAccess": false
            },
            {
                "label": "eSIM",
                "accessKey": operatorsData.esim.accessKey,
                "hasAccess": false
            },
            {
                "label": "bus",
                "accessKey": operatorsData.bus.accessKey,
                "hasAccess": true
            }
        ]
    },
    {
        "label": "Payroll",
        "accessKey": operatorsData.payroll.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Office Supplies",
        "accessKey": operatorsData['e-commerce'].accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Domain & Hosting",
        "accessKey": operatorsData.domainHosting.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Turbo",
        "accessKey": operatorsData.turbo.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "eSign",
        "accessKey": operatorsData.eSign.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Verification Suite",
        "accessKey": operatorsData.verificationSuite.accessKey,
        "hasAccess": false,
        "subServices": [
            {
                "label": "PAN Verification",
                "accessKey": operatorsData.panVerify.accessKey,
                "hasAccess": false
            },
            {
                "label": "Aadhaar OKYC Verification",
                "accessKey": operatorsData.aadharVerify.accessKey,
                "hasAccess": false
            },
            {
                "label": "Bank Account Verification",
                "accessKey": operatorsData.bankAccountVerify.accessKey,
                "hasAccess": false
            },
            {
                "label": "GST Return Compliance Check",
                "accessKey": operatorsData.gstReturnCheck.accessKey,
                "hasAccess": false
            },
            {
                "label": "GSTIN Verification",
                "accessKey": operatorsData.gstinVerify.accessKey,
                "hasAccess": false
            },
            {
                "label": "Fetch GSTIN from PAN",
                "accessKey": operatorsData.gstinPan.accessKey,
                "hasAccess": false
            },
            {
                "label": "GST Business Verification",
                "accessKey": operatorsData.gstBusinessVerify.accessKey,
                "hasAccess": false
            },
            {
                "label": "Corporate Entity Verification",
                "accessKey": operatorsData.corporateVerify.accessKey,
                "hasAccess": false
            },
            {
                "label": "Director Verification (CIN-based)",
                "accessKey": operatorsData.directorVerifyCin.accessKey,
                "hasAccess": false
            },
            {
                "label": "Director Verification (DIN-based)",
                "accessKey": operatorsData.directorVerifyDin.accessKey,
                "hasAccess": false
            }
        ]
    },
    {
        "label": "Peko Wallet",
        "accessKey": operatorsData.pekoWallet.accessKey,
        "hasAccess": false
    },
            {
        "label": "Business Registration",
        "accessKey": operatorsData.businessRegistration.accessKey,
        "hasAccess": false,
        "subServices": []
    },
  {
      "label": "Global Business Setup",
      "accessKey": operatorsData.globalBusinessSetup.accessKey,
      "hasAccess": false,
      "subServices": []
  },
  {
        "label": "Compliance",
        "accessKey": operatorsData.compliance.accessKey,
        "hasAccess": false,
        "subServices": []
    },
  {
      "label": "Global Business Setup",
      "accessKey": operatorsData.globalBusinessSetup.accessKey,
      "hasAccess": false,
      "subServices": []
  },
  {
        "label": "Payment Links",
        "accessKey": operatorsData.paymentLinks.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Compliances",
        "accessKey": operatorsData.compliance.accessKey,
        "hasAccess": false,
        "subServices":[]
    },
    {
        "label": "Procure",
        "accessKey": operatorsData.procure.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Payouts",
        "accessKey": operatorsData.payout.accessKey,
        "hasAccess": false,
        "subServices": []
    },
  {
        "label": "Document Attestation",
        "accessKey": operatorsData.documentAttestation.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Business Docs",
        "accessKey": operatorsData.businessDocs.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Office Address",
        "accessKey": operatorsData.workspace.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Soundbox",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Paytm BPOS",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "License Renewal",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Works",
        "accessKey": operatorsData.pekoWorks.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Zero Carbon",
        "accessKey": operatorsData.carbonFootprints.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Connect",
        "accessKey": operatorsData.connect.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "ESR",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Hike",
        "accessKey": operatorsData.hike.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Business Emails",
        "accessKey": operatorsData.businessEmails.accessKey,
        "hasAccess": false
    },
    {
        "label": "Government Services",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Logistics",
        "accessKey": operatorsData.logistics.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Legal Service",
        "accessKey": operatorsData.legalService.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Softwares",
        "accessKey": operatorsData.softwares.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Gift Cards",
        "accessKey": operatorsData.giftCard.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Marketplace",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Tax & More",
        "hasAccess": false,
        "subServices": [
            {
                "label": "GST Filing",
                "hasAccess": false
            },
            {
                "label": "TDS Filing",
                "hasAccess": false
            }
        ]
    },
    {
        "label": "Invoicing",
        "accessKey": operatorsData.invoicing.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Insurance",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "WhatsApp for Business",
        "accessKey": operatorsData.whatsAppBusiness.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Corporate Cards",
        "accessKey": operatorsData.corporateCards.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Accounting",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Peko Commerce",
        "accessKey": operatorsData.ecommerceStore.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Peko POS",
        "accessKey": operatorsData.pekoPos.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Hub",
        "accessKey": operatorsData.hub.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Sales",
        "accessKey": operatorsData.sales.accessKey,
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Softwares Subscriptions",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Peko Commerce",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Multicurrency Business Account",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Peko Flow",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Car Rentals",
        "hasAccess": false,
        "subServices": []
    },
    {
        "label": "Reports",
        "hasAccess": false,
        "subServices": [
            {
                "label": "Transactions",
                "hasAccess": false
            },
            {
                "label": "Cashbacks",
                "hasAccess": false
            },
            {
                "label": "Scheduling Reports",
                "hasAccess": false
            },
            {
                "label": "Subscription Transactions",
                "hasAccess": false
            }
        ]
    },
    {
        "label": "Need Help",
        "hasAccess": false,
        "subServices": [
            {
                "label": "Contact Us",
                "hasAccess": false
            },
            {
                "label": "Tickets",
                "hasAccess": false
            },
            {
                "label": "Frequently Asked Questions",
                "hasAccess": false
            }
        ]
    },
    {
        "label": "Settings",
        "hasAccess": false,
        "subServices": [
            {
                "label": "User Management",
                "hasAccess": false
            },
            {
                "label": "Billing & Saved Cards",
                "hasAccess": false
            },
            {
                "label": "Subscription Plans",
                "hasAccess": false
            },
            {
                "label": "Security",
                "hasAccess": false
            }
        ]
    }
]


module.exports = { sidebarData }
