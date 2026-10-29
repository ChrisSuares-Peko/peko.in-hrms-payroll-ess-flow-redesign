import React from 'react';

import { Button } from 'antd';
import { FiMic, FiMicOff, FiVideo, FiVideoOff } from 'react-icons/fi';
import { ReactSVG } from 'react-svg';

import disconnectIcon from '@domains/dashboard/pekoConnect/assets/disconnect.svg';
import screenShareIcon from '@domains/dashboard/pekoConnect/assets/screenShare.svg';

type CallControlsProps = {
    audioMuted: boolean;
    videoMuted: boolean;
    screenSharing: boolean;
    type: string;
    handleAudioToggle: () => void;
    handleVideoToggle: () => void;
    handleScreenShareToggle: () => void;
    onEndCall: () => void;
    cleanupStreams: () => void;
};

const CallControls: React.FC<CallControlsProps> = ({
    audioMuted,
    videoMuted,
    screenSharing,
    type,
    handleAudioToggle,
    handleVideoToggle,
    handleScreenShareToggle,
    onEndCall,
    cleanupStreams,
}) => (
    <div className="absolute z-50 flex items-center w-full h-24 p-5 bottom-10">
        <div className="flex justify-center flex-grow space-x-4 md:space-x-6">
            <Button
                size="large"
                title={audioMuted ? 'Turn On Microphone' : 'Turn Off Microphone'}
                onClick={handleAudioToggle}
                icon={audioMuted ? <FiMic /> : <FiMicOff />}
                className={`flex items-center text-xl border-0 justify-center ${
                    audioMuted ? 'bg-gray-500 text-white' : 'bg-white text-gray-500'
                } hover:${audioMuted ? 'bg-gray-500' : 'bg-white'} rounded-md`}
            />
            {type === 'video' && (
                <>
                    <Button
                        size="large"
                        title={videoMuted ? 'Turn On Camera' : 'Turn Off Camera'}
                        onClick={handleVideoToggle}
                        icon={videoMuted ? <FiVideo /> : <FiVideoOff />}
                        className={`flex items-center text-xl border-0 justify-center ${
                            videoMuted ? 'bg-gray-500 text-white' : 'bg-white text-gray-500'
                        } hover:${videoMuted ? 'bg-gray-500' : 'bg-white'} rounded-md`}
                    />
                    <Button
                        size="large"
                        title={screenSharing ? 'Stop Screen Share' : 'Start Screen Share'}
                        onClick={handleScreenShareToggle}
                        className={`flex items-center border-0 cursor-pointer justify-center px-1 py-2 ${
                            screenSharing ? 'bg-gray-500 text-white' : 'bg-white text-gray-500'
                        } hover:${
                            screenSharing ? 'bg-gray-500 text-white' : 'bg-white text-brandColor'
                        } rounded-md`}
                        icon={
                            <ReactSVG
                                src={screenShareIcon}
                                beforeInjection={svg => {
                                    svg.setAttribute('style', 'width: 34px; height: 22px;');
                                }}
                            />
                        }
                    />
                </>
            )}
            <Button
                size="large"
                title="Disconnect Call"
                onClick={() => {
                    cleanupStreams();
                    onEndCall();
                }}
                className="flex items-center justify-center px-1 py-2 text-white border-none rounded-full bg-brandColor hover:text-white"
                style={{ backgroundColor: 'red', border: 'none' }}
                icon={
                    <ReactSVG
                        src={disconnectIcon}
                        beforeInjection={svg => {
                            svg.setAttribute('style', 'width: 34px; height: 22px;');
                        }}
                    />
                }
            />
        </div>
    </div>
);

export default CallControls;
