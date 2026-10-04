import SceneFx from '@/components/scene-fx/SceneFx';

import './trading-backdrop.scss';

/**
 * Shared dark scene (Dashboard, Free Bots): the Traders Scheeme cosmic artwork
 * (public/backgrounds/cosmos-dark.svg - violet nebulae, silk light-ribbons, a gold
 * ringed planet and a constellation network) with a little life on top: drifting
 * glow orbs, twinkling stars and the odd shooting star. Purely decorative.
 */
const TradingBackdrop = () => (
    <div className='trading-backdrop' aria-hidden='true'>
        <span className='trading-backdrop__orb trading-backdrop__orb--sky' />
        <span className='trading-backdrop__orb trading-backdrop__orb--purple' />
        <span className='trading-backdrop__orb trading-backdrop__orb--gold' />
        <span className='trading-backdrop__twinkle' />
        <span className='trading-backdrop__comet' />
        <span className='trading-backdrop__comet trading-backdrop__comet--late' />
        <SceneFx variant='dark' />
    </div>
);

export default TradingBackdrop;
