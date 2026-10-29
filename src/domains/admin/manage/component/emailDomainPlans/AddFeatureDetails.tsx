import { DeleteOutlined } from '@ant-design/icons';
import { Button, Col, Flex, Row } from 'antd';
import { ErrorMessage, FieldArray } from 'formik';

import TextInput from '@components/atomic/inputs/TextInput';
import { useAppDispatch } from '@src/hooks/store';
import { showToast } from '@src/slices/apiSlice';

import { featureDetails } from '../../types/emailDomainPlan';

type Props = {
    values: featureDetails[];
    isRequired?: boolean;
};

const AddFeatureDetails = ({ values, isRequired = true }: Props) => {
    const dispatch = useAppDispatch();
    return (
        <Flex vertical justify="end" gap={20}>
            <FieldArray name="features">
                {({ push, remove }) => (
                    <>
                        {values.length > 0 &&
                            values.map((_, index) => (
                                <Row gutter={[20, 20]} key={index} justify="start" align="middle">
                                    <Col xs={12}>
                                        <Flex className="flex-col">
                                            <TextInput
                                                name={`features[${index}].label`}
                                                label="Feature Label"
                                                type="text"
                                                placeholder="Enter feature Label"
                                                classes=" rounded-sm"
                                                isRequired={isRequired}
                                            />
                                            <ErrorMessage
                                                name={`features[${index}].label`}
                                                render={msg => (
                                                    <div className="-mt-6 text-red-500 error-message">
                                                        {msg}
                                                    </div>
                                                )}
                                            />
                                        </Flex>
                                    </Col>
                                    <Col xs={12}>
                                        <Flex className="flex-col">
                                            <TextInput
                                                name={`features[${index}].value`}
                                                label="Feature Value"
                                                type="text"
                                                placeholder="Enter feature value"
                                                isRequired={isRequired}
                                            />
                                            <ErrorMessage
                                                name={`features[${index}].value`}
                                                render={msg => (
                                                    <div className="-mt-6 text-red-500 error-message">
                                                        {msg}
                                                    </div>
                                                )}
                                            />
                                        </Flex>
                                    </Col>
                                    {index > 0 && (
                                        <Col xs={3}>
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
            <FieldArray name="features">
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
                                          description: 'You can only add up to 5 features.',
                                      })
                                  )
                        }
                    >
                        Add Feature
                    </Button>
                )}
            </FieldArray>
        </Flex>
    );
};

export default AddFeatureDetails;
