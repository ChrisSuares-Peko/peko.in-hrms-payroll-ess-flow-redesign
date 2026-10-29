import { ProjectImage1, ProjectImage2 } from '../../assets/images/projectDetails.tsx/index.js';

interface IProjectDescription {
    title: string;
    desc: string;
}

export const ProjectDescription: IProjectDescription[] = [
    {
        title: 'Land Use and Forestry, India',
        desc: `Envolve the installation and utilization of solar panels or photovoltaic
        (PV) modules to harness the energy from the sun and convert it into
        electricity. These projects are aimed at promoting renewable energy sources,`,
    },
    {
        title: 'How it works',
        desc: `Envolve the installation and utilization of solar panels or photovoltaic
        (PV) modules to harness the energy from the sun and convert it into
        electricity. These projects are aimed at promoting renewable energy sources,`,
    },
];

export const ProjectImages = [ProjectImage1, ProjectImage2, ProjectImage1, ProjectImage2];
