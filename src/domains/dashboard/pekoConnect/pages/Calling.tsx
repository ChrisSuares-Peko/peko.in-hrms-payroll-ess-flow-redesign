import { Button } from 'antd';
import { CiVideoOn } from 'react-icons/ci';
import { FiPhoneOff } from 'react-icons/fi';

interface CallingProps {
    mode?: string;
    hangUp: any;
}

const Calling = ({ mode, hangUp }: CallingProps) => (
    // fullscreen-video
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 ">
        <div className="relative p-6 rounded-lg">
            <h3 className="flex items-center text-xl font-semibold text-center text-white">
                <CiVideoOn className="mr-2" />
                <span className="text-left">
                    {mode === 'create' ? 'Connecting...' : 'Joining...'}
                </span>
            </h3>
            {mode === 'create' && (
                <div className="flex justify-center mt-4">
                    <Button
                        onClick={hangUp}
                        icon={<FiPhoneOff />}
                        className="text-white border-0 rounded-md bg-brandColor outline-brandColor hover:bg-red-400"
                    >
                        End Call
                    </Button>
                </div>
            )}
        </div>
    </div>
);

export default Calling;
