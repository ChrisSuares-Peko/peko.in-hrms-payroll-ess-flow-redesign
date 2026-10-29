import cardArt from '../../../assets/kybLanding/cards.png';

const CardArtwork = () => (
    <img
        src={cardArt}
        alt=""
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-1/2 w-24 -translate-x-1/2 translate-y-8 -rotate-[7.73deg] drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)] sm:w-28 xl:w-32"
    />
);

export default CardArtwork;
