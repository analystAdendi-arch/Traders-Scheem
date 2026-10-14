import React from 'react';
import { observer } from 'mobx-react-lite';

import { useDebounce } from '@deriv/api-v2';
import { mapErrorMessage } from '@deriv/shared';
import { ActionSheet, Chip, Text, TextField, TextFieldAddon } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';

import { useProposal } from 'AppV2/Hooks/useProposal';
import { getDisplayedContractTypes } from 'AppV2/Utils/trade-types-utils';
import { useTraderStore } from 'Stores/useTraderStores';

const chips_options = [
    {
        name: <Localize i18n_default_text='Above spot' />,
    },
    {
        name: <Localize i18n_default_text='Below spot' />,
    },
    {
        name: <Localize i18n_default_text='Fixed barrier' />,
    },
];

const BarrierInput = observer(
    ({ isDays, onClose, is_open }: { isDays: boolean; onClose: (val: boolean) => void; is_open?: boolean }) => {
        const trade_store = useTraderStore();
        const { barrier_1, onChange, tick_data, symbol, active_symbols, contract_type, trade_type_tab, trade_types } =
            trade_store;

        const { localize } = useTranslations();

        // Get barrier support type with safe fallback
        const getBarrierSupport = React.useCallback(() => {
            if (!symbol || !active_symbols?.length) return 'relative'; // Default to relative to show tabs

            const symbol_info = active_symbols.find(s => s.underlying_symbol === symbol);
            if (!symbol_info) return 'relative'; // Default to relative to show tabs

            const { market, underlying_symbol_type } = symbol_info;

            // Forex markets only support absolute barriers
            if (market === 'forex' || underlying_symbol_type === 'forex') {
                return 'absolute';
            }

            // Most other markets (synthetic_index, etc.) support relative barriers
            return 'relative';
        }, [symbol, active_symbols]);

        const barrierSupport = getBarrierSupport();

        // Helper function to calculate initial state from barrier_1 value
        const calculateInitialState = React.useCallback(() => {
            // Handle empty/undefined barrier_1 safely
            if (!barrier_1 || barrier_1.trim() === '') {
                // Set default values based on barrier support type
                if (barrierSupport === 'absolute') {
                    return {
                        tabIndex: 2, // Fixed barrier
                        inputValue: '1.0000',
                        barrierValue: '1.0000',
                    };
                }
                return {
                    tabIndex: 0, // Above spot (default for relative)
                    inputValue: '0.1',
                    barrierValue: '+0.1',
                };
            }

            // Parse existing barrier_1 value
            if (barrier_1.startsWith('+')) {
                return {
                    tabIndex: 0, // Above spot
                    inputValue: barrier_1.slice(1),
                    barrierValue: barrier_1,
                };
            } else if (barrier_1.startsWith('-')) {
                return {
                    tabIndex: 1, // Below spot
                    inputValue: barrier_1.slice(1),
                    barrierValue: barrier_1,
                };
            }
            return {
                tabIndex: 2, // Fixed barrier
                inputValue: barrier_1,
                barrierValue: barrier_1,
            };
        }, [barrier_1, barrierSupport]);

        // Calculate initial state immediately to prevent empty value validation
        const initialState = calculateInitialState();

        // Local state for editing - initialize with calculated values
        const [selectedTab, setSelectedTab] = React.useState(initialState.tabIndex);
        const [inputValue, setInputValue] = React.useState(initialState.inputValue);
        const [isInitialized, setIsInitialized] = React.useState(false);

        // Local state for proposal request values (similar to Stake component)
        const [proposalRequestValues, setProposalRequestValues] = React.useState({
            barrier_1: initialState.barrierValue,
        });

        // Debounce the input value for real-time validation (300ms for responsive UX)
        const debouncedInputValue = useDebounce(inputValue, 300);

        const { pip_size } = tick_data ?? {};
        const barrier_ref = React.useRef<HTMLInputElement | null>(null);

        // Local validation error state for real-time feedback - must be declared before useProposal
        const [localValidationError, setLocalValidationError] = React.useState<string>('');

        // Get contract_types for proposal validation - only compute when modal is open
        const contract_types = React.useMemo(
            () => (is_open ? getDisplayedContractTypes(trade_types, contract_type, trade_type_tab) : []),
            [is_open, trade_types, contract_type, trade_type_tab]
        );

        // Use proposal hook for real-time API validation without updating store
        // Only enable when modal is open, value is not empty, and client-side validation passes
        const { error: proposalError, isFetching: isLoadingProposal } = useProposal({
            trade_store,
            proposal_request_values: proposalRequestValues,
            contract_type: contract_types[0],
            is_enabled: is_open && proposalRequestValues.barrier_1 !== '' && localValidationError === '',
        });

        // Initialize state when modal opens - fixed to avoid circular dependency
        React.useEffect(() => {
            // Only update store if barrier_1 is empty and we need to set a default
            if (!barrier_1 || barrier_1.trim() === '') {
                const defaultValue = barrierSupport === 'absolute' ? '1.0000' : '+0.1';
                onChange({
                    target: {
                        name: 'barrier_1',
                        value: defaultValue,
                    },
                });
            }

            // Mark as initialized to enable validation
            setIsInitialized(true);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [barrier_1, barrierSupport]); // Exclude onChange as it's from parent

        // Update local state when barrier_1 changes from external sources (e.g., symbol change)
        React.useEffect(() => {
            if (!isInitialized || !barrier_1) {
                return;
            }

            // Inline state calculation to avoid dependency issues
            let newTabIndex = 0;
            let newInputValue = '';

            if (barrier_1.startsWith('+')) {
                newTabIndex = 0; // Above spot
                newInputValue = barrier_1.slice(1);
            } else if (barrier_1.startsWith('-')) {
                newTabIndex = 1; // Below spot
                newInputValue = barrier_1.slice(1);
            } else {
                newTabIndex = 2; // Fixed barrier
                newInputValue = barrier_1;
            }

            // Only update if values actually changed
            setSelectedTab(prevTab => (prevTab !== newTabIndex ? newTabIndex : prevTab));
            setInputValue(prevValue => (prevValue !== newInputValue ? newInputValue : prevValue));
        }, [barrier_1, isInitialized]);

        // Track API validation errors from useProposal hook
        const apiValidationError = React.useMemo(() => {
            if (
                proposalError &&
                (proposalError.details?.field === 'barrier' || proposalError.details?.field === 'barrier2')
            ) {
                return mapErrorMessage(proposalError);
            }
            return '';
        }, [proposalError]);

        // Client-side validation function that replicates store validation rules
        const validateBarrierValue = React.useCallback(
            (value: string, _selectedTab: number): string => {
                // Skip validation if component is not initialized to prevent flash of error
                if (!isInitialized) {
                    return '';
                }

                if (!value || value.trim() === '') {
                    return localize('Barrier is a required field.');
                }

                // Check for incomplete decimal values like "0." or trailing decimals
                if (value.endsWith('.') || /\.\s*$/.test(value)) {
                    return localize('Please enter a complete number.');
                }

                const numericValue = parseFloat(value);
                if (isNaN(numericValue)) {
                    return localize('Please enter a valid number.');
                }

                // Check for zero values on ALL barrier types (both relative and fixed)
                if (numericValue === 0) {
                    return localize('Barrier cannot be zero.');
                }

                return ''; // No error
            },
            [localize, isInitialized]
        );

        // Effect to run client-side validation and update proposal request values on debounced input changes
        React.useEffect(() => {
            // Only run validation after component is initialized and we have a meaningful value
            if (!isInitialized || debouncedInputValue === undefined) {
                return;
            }

            // Inline validation to avoid dependency issues
            let error = '';

            if (!debouncedInputValue || debouncedInputValue.trim() === '') {
                error = localize('Barrier is a required field.');
            } else if (debouncedInputValue.endsWith('.') || /\.\s*$/.test(debouncedInputValue)) {
                error = localize('Please enter a complete number.');
            } else {
                const numericValue = parseFloat(debouncedInputValue);
                if (isNaN(numericValue)) {
                    error = localize('Please enter a valid number.');
                } else if (numericValue === 0) {
                    error = localize('Barrier cannot be zero.');
                }
            }

            // Only update state if the error actually changed
            setLocalValidationError(prevError => {
                if (prevError !== error) {
                    return error;
                }
                return prevError;
            });

            // Update proposal request values for API validation (without updating store)
            if (!error) {
                let newValue = debouncedInputValue;
                if (selectedTab === 0) {
                    newValue = `+${debouncedInputValue}`;
                } else if (selectedTab === 1) {
                    newValue = `-${debouncedInputValue}`;
                }

                // Only update if the value actually changed
                setProposalRequestValues(prev => {
                    if (prev.barrier_1 !== newValue) {
                        return { barrier_1: newValue };
                    }
                    return prev;
                });
            }
        }, [debouncedInputValue, selectedTab, isInitialized]);

        // Show validation errors in real-time (client-side + API errors)
        const show_validation_error = localValidationError !== '' || apiValidationError !== '';
        const displayError = localValidationError || apiValidationError;

        const handleChipSelect = (index: number) => {
            setSelectedTab(index);
            // Keep the current numeric value when switching tabs
            const numericValue = inputValue.replace(/^[+-]/, '');
            setInputValue(numericValue);
        };

        const handleOnChange = (e: { target: { name: string; value: string } }) => {
            setInputValue(e.target.value);
        };

        const handleSave = () => {
            // Prevent save if there are any validation errors or if API is still loading
            if (show_validation_error || isLoadingProposal) {
                return;
            }

            // Run final validation before saving
            const finalError = validateBarrierValue(inputValue, selectedTab);

            if (finalError === '') {
                // Create the final barrier value based on selected tab
                let newValue = inputValue;
                if (selectedTab === 0) {
                    newValue = `+${inputValue}`;
                } else if (selectedTab === 1) {
                    newValue = `-${inputValue}`;
                }

                // Update the trade store (this is the ONLY place where we update the store)
                onChange({ target: { name: 'barrier_1', value: newValue } });
                onClose(true);
            } else {
                // Update local error state if validation fails
                setLocalValidationError(finalError);
            }
        };

        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
                const isSaveDisabled = show_validation_error || isLoadingProposal;
                if (!isSaveDisabled) {
                    handleSave();
                }
            }
        };

        return (
            <>
                <ActionSheet.Content>
                    <div className='barrier-params'>
                        {!isDays && barrierSupport === 'relative' && (
                            <div className='barrier-params__chips'>
                                {chips_options.map((item, index) => (
                                    <Chip.Selectable
                                        key={index}
                                        onClick={() => handleChipSelect(index)}
                                        selected={index === selectedTab}
                                    >
                                        <Text size='sm'>{item.name}</Text>
                                    </Chip.Selectable>
                                ))}
                            </div>
                        )}

                        <div>
                            {selectedTab === 2 || isDays ? (
                                <TextField
                                    customType='commaRemoval'
                                    name='barrier_1'
                                    noStatusIcon
                                    status={show_validation_error ? 'error' : 'neutral'}
                                    value={inputValue}
                                    allowDecimals
                                    decimals={pip_size}
                                    allowSign={false}
                                    inputMode='decimal'
                                    regex={/[^0-9.,]/g}
                                    textAlignment='center'
                                    onChange={handleOnChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={localize('Price')}
                                    variant='fill'
                                    message={show_validation_error ? displayError : ''}
                                    ref={barrier_ref}
                                />
                            ) : (
                                <TextFieldAddon
                                    fillAddonBorderColor='var(--semantic-color-slate-solid-surface-frame-mid)'
                                    customType='commaRemoval'
                                    name='barrier_1'
                                    noStatusIcon
                                    addonLabel={selectedTab === 0 ? '+' : '-'}
                                    decimals={pip_size}
                                    value={inputValue}
                                    allowDecimals
                                    inputMode='decimal'
                                    allowSign={false}
                                    status={show_validation_error ? 'error' : 'neutral'}
                                    onChange={handleOnChange}
                                    onKeyDown={handleKeyDown}
                                    placeholder={localize('Distance to spot')}
                                    regex={/[^0-9.,]/g}
                                    variant='fill'
                                    message={show_validation_error ? displayError : ''}
                                    ref={barrier_ref}
                                />
                            )}
                            {!show_validation_error && <div className='barrier-params__error-area' />}
                        </div>
                        <div className='barrier-params__current-spot-wrapper'>
                            <Text size='sm'>
                                <Localize i18n_default_text='Current spot' />
                            </Text>
                            <Text size='sm'>{tick_data?.quote}</Text>
                        </div>
                    </div>
                </ActionSheet.Content>
                <ActionSheet.Footer
                    alignment='vertical'
                    shouldCloseOnPrimaryButtonClick={false}
                    primaryAction={{
                        content: <Localize i18n_default_text='Save' />,
                        onAction: handleSave,
                    }}
                    isPrimaryButtonDisabled={show_validation_error || isLoadingProposal}
                />
            </>
        );
    }
);

export default BarrierInput;
