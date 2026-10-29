import React, { useState, useMemo } from 'react';

// import { SearchOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Form, Typography } from 'antd';
import * as Yup from 'yup';

import TextInput from '@components/atomic/inputs/TextInput';
import CustomModalWithForm from '@components/molecular/modals/CustomModalWithForm';

import WebTable from './WebTable';
import { useCreateProjectApi } from '../../hooks/useCreateProject';
import GetAllProjects from '../../hooks/useGetProjects';

const { Text } = Typography;

const ProjectList = () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [searchValue, setSearchValue] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [refresh, setRefresh] = useState(false); // State to trigger re-fetching projects

    const { projectData, isLoading } = GetAllProjects(refresh); // Pass `refresh` to the hook
    const { createProject, isLoading: isCreating } = useCreateProjectApi();

    const handleCreateNewProject = async (values: { name: string }) => {
        const success = await createProject(values.name);
        if (success) {
            setIsModalVisible(false);
            setRefresh(prev => !prev); // Toggle `refresh` to trigger re-fetch
        }
    };

    const validationSchema = Yup.object().shape({
        name: Yup.string().trim().required('Project name is required'),
    });

    // Filter project data based on search value
    const filteredProjectData = useMemo(() => {
        if (!searchValue) return projectData;
        return projectData?.filter(project =>
            project.name.toLowerCase().includes(searchValue.toLowerCase())
        );
    }, [projectData, searchValue]);

    const refreshProjects = () => {
        setRefresh(prev => !prev);
    };
    return (
        <Col>
            <Flex justify="space-between" className="mb-5">
                <Text className="font-medium sm:text-xl">My Projects</Text>
                <Button type="primary" danger onClick={() => setIsModalVisible(true)}>
                    Create New Project
                </Button>
            </Flex>

            <WebTable
                projectData={filteredProjectData}
                isLoading={isLoading}
                refreshProjects={refreshProjects}
            />
            <CustomModalWithForm
                open={isModalVisible}
                handleCancel={() => setIsModalVisible(false)}
                initialValues={{ name: '' }}
                modalTitle="Create New Project"
                handleFormSubmit={handleCreateNewProject}
                validationSchema={validationSchema}
                isLoading={isCreating}
            >
                <Flex vertical className="w-full">
                    <Form layout="vertical">
                        <TextInput
                            name="name"
                            label="Project Name"
                            type="text"
                            placeholder="Name"
                            isRequired
                            classes="rounded-sm"
                        />
                    </Form>
                </Flex>
            </CustomModalWithForm>
        </Col>
    );
};

export default ProjectList;
