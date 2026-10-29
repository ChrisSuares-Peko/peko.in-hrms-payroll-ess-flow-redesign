import { Button, Flex, Typography, Card } from 'antd';

interface ResultCardProps {
    value: any;
    onNeutralize: () => void;
}

const { Text } = Typography;

const ResultCard = ({ value, onNeutralize }: ResultCardProps) => (
    <Card className="rounded-lg w-full h-full md:min-w-64  bg-bgResultCard flex justify-center self-center align-middle border border-solid shadow-none">
        <Flex
            vertical
            gap={15}
            align="center"
            justify="center"
            className=" h-full  w-full sm:flex row"
        >
            <Flex vertical gap={15}>
                <Text className="text-6xl font-bold text-center">{value}</Text>
                <Text className=" Text-lg text-center  ">tons CO₂ eq/year</Text>
            </Flex>
            <Button danger type="primary" className="h-10 px-12" onClick={onNeutralize}>
                Neutralise
            </Button>
        </Flex>
    </Card>
);
export default ResultCard;
