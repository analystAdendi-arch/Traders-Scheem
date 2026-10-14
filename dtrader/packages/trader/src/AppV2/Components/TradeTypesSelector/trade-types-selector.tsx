import { useCallback, useRef, useState } from 'react';

import TooltipPortal from '@deriv/components/src/components/tooltip-portal/tooltip-portal';
import { Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';

import { InputPopover } from 'AppV2/Components/InputPopover';
import GridIcon from 'Assets/SvgComponents/ic-grid.svg';

import { TAvailableContract } from '../../Utils/trade-types-utils';

import TradeTypesSelectorContent from './trade-types-selector-content';

import './trade-types-selector.scss';

type TTradeTypesSelectorProps = {
    available_contracts: TAvailableContract[];
    selected_trade_type: string;
    onTradeTypeSelect: (type: string, tab: 'all' | 'most_traded') => void;
    onGuideClick: () => void;
};

/**
 * TradeTypesSelector Component
 *
 * Pure presentational component that receives all data via props.
 * Does NOT need MobX observer() wrapper because it doesn't access MobX stores directly.
 *
 * Data Flow: MobX Store → TradeTypes (observer) → TradeTypesSelector (props)
 * The parent TradeTypes component handles all MobX integration.
 */
const TradeTypesSelector = ({
    available_contracts,
    selected_trade_type,
    onTradeTypeSelect,
    onGuideClick,
}: TTradeTypesSelectorProps) => {
    const [is_open, setIsOpen] = useState(false);
    const [active_tab, setActiveTab] = useState<'all' | 'most_traded'>('all');
    const button_ref = useRef<HTMLButtonElement>(null);

    const handleOpen = useCallback(() => {
        setIsOpen(true);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setActiveTab('all');
    }, []);

    const handleTradeTypeSelect = useCallback(
        (type: string) => {
            onTradeTypeSelect(type, active_tab);
            handleClose();
        },
        [onTradeTypeSelect, handleClose, active_tab]
    );

    const handleGuideClick = useCallback(() => {
        handleClose();
        onGuideClick();
    }, [handleClose, onGuideClick]);

    return (
        <div className='trade-types-selector'>
            {!is_open ? (
                <TooltipPortal message={<Localize i18n_default_text='Explore trade types' />} position='bottom'>
                    <button
                        ref={button_ref}
                        className={`trade-types-selector__button ${is_open ? 'trade-types-selector__button--active' : ''}`}
                        onClick={handleOpen}
                        aria-label='View all trade types'
                        aria-expanded={is_open}
                        aria-haspopup='dialog'
                    >
                        <GridIcon />
                    </button>
                </TooltipPortal>
            ) : (
                <button
                    ref={button_ref}
                    className={`trade-types-selector__button ${is_open ? 'trade-types-selector__button--active' : ''}`}
                    onClick={handleOpen}
                    aria-label='View all trade types'
                    aria-expanded={is_open}
                    aria-haspopup='dialog'
                >
                    <GridIcon />
                </button>
            )}
            <InputPopover
                isOpen={is_open}
                onClose={handleClose}
                triggerRef={button_ref}
                className='trade-types-selector__popover'
                popoverWidth={320}
                placement='bottom'
            >
                <div className='trade-types-selector__modal' role='dialog' aria-label='Trade types selection'>
                    <div className='trade-types-selector__header'>
                        <Text size='lg' bold>
                            <Localize i18n_default_text='Trade types' />
                        </Text>
                        <button className='trade-types-selector__guide-button' onClick={handleGuideClick}>
                            <Text size='sm' bold>
                                <Localize i18n_default_text='Guide' />
                            </Text>
                        </button>
                    </div>
                    <div className='trade-types-selector__tabs' role='tablist'>
                        <button
                            className={`trade-types-selector__tab ${active_tab === 'all' ? 'trade-types-selector__tab--active' : ''}`}
                            onClick={() => {
                                setActiveTab('all');
                            }}
                            role='tab'
                            aria-selected={active_tab === 'all'}
                            aria-controls='trade-types-content'
                        >
                            <Text size='md'>
                                <Localize i18n_default_text='All' />
                            </Text>
                        </button>
                        <button
                            className={`trade-types-selector__tab ${active_tab === 'most_traded' ? 'trade-types-selector__tab--active' : ''}`}
                            onClick={() => {
                                setActiveTab('most_traded');
                            }}
                            role='tab'
                            aria-selected={active_tab === 'most_traded'}
                            aria-controls='trade-types-content'
                        >
                            <Text size='md'>
                                <Localize i18n_default_text='Most traded' />
                            </Text>
                        </button>
                    </div>
                    <TradeTypesSelectorContent
                        available_contracts={available_contracts}
                        selected_trade_type={selected_trade_type}
                        active_tab={active_tab}
                        onTradeTypeSelect={handleTradeTypeSelect}
                    />
                </div>
            </InputPopover>
        </div>
    );
};

export default TradeTypesSelector;
