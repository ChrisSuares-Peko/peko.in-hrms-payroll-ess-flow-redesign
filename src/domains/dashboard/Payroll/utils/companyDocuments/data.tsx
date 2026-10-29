

import legalIcon from '../../assets/icons/companydocuments/fileDoneIcon.svg'
import policyIcon from '../../assets/icons/companydocuments/fileprotecticon.svg'
import projectionIcon from '../../assets/icons/companydocuments/projectionIcon.svg'
import safetyIcon from '../../assets/icons/companydocuments/safetyicon.svg'
import teamIcon from '../../assets/icons/teamIcon.svg'




export const DocCategories = [
    { title: 'Employment & Onboarding', fileCount: 7, svgIcon: teamIcon ,path:'employment-onboarding'},
    { title: 'Employee Policies & Manuals', fileCount: 7, svgIcon: policyIcon, path:'policies' },
    { title: 'Compliance & Legal', fileCount: 7, svgIcon: legalIcon,path:'compliance-legal' },
    { title: 'Performance & Exit', fileCount: 7, svgIcon:projectionIcon,path:'performance-exit' },
    { title: 'Forms & Miscellaneous', fileCount: 7, svgIcon: safetyIcon,path:'employment-onboarding' },
];