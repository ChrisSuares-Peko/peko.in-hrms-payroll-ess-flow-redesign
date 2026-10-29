import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { ErrorMessage, FieldArray } from 'formik';

import InputTextArea from '@components/atomic/inputs/InputTextArea';
import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { descriptionDetails } from '../../types/emailDomainPlan';

type Props = {
    values: descriptionDetails[];
};

const AddDescriptionDetails = ({ values }: Props) => {
    const dispatch = useAppDispatch();
    return (
        <Flex vertical justify="end" gap={20}>
            <FieldArray name="descriptions">
                {({ push, remove }) => (
                    <>
                        {values.length > 0 &&
                            values.map((_, index) => (
                                <Row key={index} justify="start" align="middle">
                                    <Col xs={18}>
                                        <Flex className="flex-col">
                                            <TextInput
                                                name={`descriptions[${index}].label`}
                                                label="Description Label"
                                                type="text"
                                                placeholder="Enter description Label"
                                                isRequired
                                                classes=" rounded-sm"
                                            />
                                            <ErrorMessage
                                                name={`descriptions[${index}].label`}
                                                render={msg => (
                                                    <div className="-mt-6 text-red-500 error-message">
                                                        {msg}
                                                    </div>
                                                )}
                                            />
                                        </Flex>
                                    </Col>
                                    <Col xs={20}>
                                        <Flex className="flex-col">
                                            <InputTextArea
                                                name={`descriptions[${index}].value`}
                                                label="Description Value"
                                                placeholder="Enter description value"
                                                isRequired
                                            />
                                            <ErrorMessage
                                                name={`descriptions[${index}].value`}
                                                render={msg => (
                                                    <div className="-mt-6 text-red-500 error-message">
                                                        {msg}
                                                    </div>
                                                )}
                                            />
                                        </Flex>
                                    </Col>
                                    {index > 0 && (
                                        <Col xs={4}>
                                            <DeleteOutlined
                                                onClick={() => remove(index)}
                                                className="pl-3 text-xl text-bgOrange2"
                                            />
                                        </Col>
                                    )}
                                </Row>
                            ))}
                    </>
                )}
            </FieldArray>
            <FieldArray name="descriptions">
                {({ push }) => (
                    <Button
                        className="mb-5"
                        danger
                        onClick={() =>
                            values.length < 5
                                ? push({
                                      label: '',
                                      value: '',
                                  })
                                : dispatch(
                                      showToast({
                                          variant: 'error',
                                          description: 'You can only add up to 5 descriptions.',
                                      })
                                  )
                        }
                    >
                        Add Description
                    </Button>
                )}
            </FieldArray>
        </Flex>
    );
};

export default AddDescriptionDetails;
