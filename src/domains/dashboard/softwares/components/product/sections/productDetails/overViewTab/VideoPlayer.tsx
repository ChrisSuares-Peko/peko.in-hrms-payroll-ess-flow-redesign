import { Carousel, Skeleton } from 'antd';
// @ts-ignore
import ReactPlayer from 'react-player';

import { useProductContext } from '@src/domains/dashboard/softwares/contexts/ProductContext';

const VideoPlayer = () => {
    const { product, isLoading, playingVideoIndex, setPlayingVideoIndex } = useProductContext();

    if (isLoading) return <Skeleton />;
    if (!product) return null;
    return (
        <Carousel
            className="w-full rounded-2xl overflow-hidden"
            infinite={false}
            afterChange={() => {
                setPlayingVideoIndex(null);
            }}
        >
            {product.videos.map((video: string, index: number) => (
                <div key={index} className="w-full sm:h-96">
                    <ReactPlayer
                        src={video}
                        controls
                        width="100%"
                        height="100%"
                        light
                        playing={playingVideoIndex === index}
                        onPlay={() => setPlayingVideoIndex(index)}
                        onClickPreview={() => setPlayingVideoIndex(index)}
                    />
                </div>
            ))}
        </Carousel>
    );
};

export default VideoPlayer;
