import React, { useCallback, useMemo, useState } from 'react';
import { observer } from 'mobx-react-lite';

import { Localize } from '@deriv-com/translations';

import { TradeParameterPopover, useTradeParameterPopover } from 'AppV2/Components/TradeParameters/Shared';
import { useTraderStore } from 'Stores/useTraderStores';

import BarrierContentDesktop from './barrier-content-desktop';
import BarrierTypeSelector from './barrier-type-selector';

interface BarrierDesktopProps {
    is_minimized?: boolean;
    isDays: boolean;
}

const getBarrierType = (barrier: string, showBarrierTypes: boolean): string => {
    if (!showBarrierTypes) return 'fixed_barrier';
    if (!barrier) return 'above_spot';
    if (barrier.startsWith('+')) return 'above_spot';
    if (barrier.startsWith('-')) return 'below_spot';
    return 'fixed_barrier';
};

const BarrierPopoverContent: React.FC<{
    selectedType: string;
    onSelectType: (type: string) => void;
    showBarrierTypes: boolean;
}> = ({ selectedType, onSelectType, showBarrierTypes }) => {
    const { closePopover } = useTradeParameterPopover();

    return (
        <div className='barrier-popover__layout'>
            <div className='barrier-popover__sidebar'>
                <BarrierTypeSelector
                    selectedType={selectedType}
                    onSelectType={onSelectType}
                    showAllTypes={showBarrierTypes}
                />
            </div>
            <div className='barrier-popover__main'>
                <div className='barrier-popover__content'>
                    <BarrierContentDesktop barrierType={selectedType} onClose={closePopover} />
                </div>
            </div>
        </div>
    );
};

const BarrierDesktop: React.FC<BarrierDesktopProps> = observer(({ is_minimized, isDays }) => {
    const { barrier_1, is_market_closed, symbol, active_symbols } = useTraderStore();

    const barrierSupport = useMemo(() => {
        if (!symbol || !active_symbols?.length) return 'relative';

        const symbol_info = active_symbols.find((s: { underlying_symbol?: string }) => s.underlying_symbol === symbol);
        if (!symbol_info) return 'relative';

        const { market, underlying_symbol_type } = symbol_info as {
            market?: string;
            underlying_symbol_type?: string;
        };

        if (market === 'forex' || underlying_symbol_type === 'forex') {
            return 'absolute';
        }

        return 'relative';
    }, [symbol, active_symbols]);

    const showBarrierTypes = !isDays && barrierSupport === 'relative';

    const initialType = useMemo(() => getBarrierType(barrier_1, showBarrierTypes), [barrier_1, showBarrierTypes]);
    const [selectedType, setSelectedType] = useState(initialType);

    // [AI]
    React.useEffect(() => {
        setSelectedType(initialType);
    }, [initialType]);

    const handleTypeSelect = useCallback((type: string) => {
        setSelectedType(type);
    }, []);

    return (
        <TradeParameterPopover
            popoverWidth={360}
            label={<Localize i18n_default_text='Barrier' key={`barrier${is_minimized ? '-minimized' : ''}`} />}
            value={barrier_1}
            is_minimized={is_minimized}
            disabled={is_market_closed}
            popover_classname='barrier-popover'
        >
            <BarrierPopoverContent
                selectedType={selectedType}
                onSelectType={handleTypeSelect}
                showBarrierTypes={showBarrierTypes}
            />
        </TradeParameterPopover>
    );
});
// [/AI]

export default BarrierDesktop;
