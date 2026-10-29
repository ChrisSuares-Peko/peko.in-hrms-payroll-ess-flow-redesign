import SuccessScreen from '@components/molecular/success/SuccessScreen';

const RequestSuccess = () => (
    // const defaultOptions = {
    //     loop: false,
    //     autoplay: true,
    //     animationData: Success,
    // };
    <SuccessScreen
        title="Thank You For Your Interest!"
        message="Thanks for filling the form for schedulling a free demo, We will reach out within 48 hours."
        isOtherSuccess
    />
    // <Flex vertical justify="center" align="center" gap={20} className="">
    //     <Result
    //         className="md:w-3/6  p-0"
    //         icon={<Lottie options={defaultOptions} height={50} />}
    //         status="success"
    //         title="Thank You For Your Interest!"
    //         subTitle="Thanks for filling the form for schedulling a free demo, We will reach out within 48 hours."
    //     />
    // </Flex>
);

export default RequestSuccess;
