import React, { useCallback, useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

import { useMobileBridge } from '@deriv/api';
import { Skeleton } from '@deriv/components';
import { LabelPairedPresentationScreenSmRegularIcon } from '@deriv/quill-icons';
import { safeParse } from '@deriv/utils';
import { ActionSheet, Button, Chip, Text } from '@deriv-com/quill-ui';
import { Localize, useTranslations } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import Carousel from 'AppV2/Components/Carousel';
import CarouselHeader from 'AppV2/Components/Carousel/carousel-header';
import FireIcon from 'AppV2/Components/FireIcon';
import TradeTypesSelectionGuide from 'AppV2/Components/OnboardingGuide/TradeTypesSelectionGuide';
import TradeTypesSelector from 'AppV2/Components/TradeTypesSelector';
import { checkContractTypePrefix } from 'AppV2/Utils/contract-type';
import {
    AVAILABLE_CONTRACTS,
    getAvailableContracts,
    getTradeTypesList,
    sortCategoriesInTradeTypeOrder,
} from 'AppV2/Utils/trade-types-utils';
import { useTraderStore } from 'Stores/useTraderStores';

import Guide from '../../Components/Guide';

import TradeTypesContent from './trade-types-content';

type TTradeTypesProps = {
    onTradeTypeSelect: (
        e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
        subform_name: string,
        trade_type_count: number,
        tab?: 'all' | 'most_traded'
    ) => void;
    trade_types: ReturnType<typeof getTradeTypesList>;
    contract_type: string;
    is_dark_mode_on: boolean;
} & Pick<ReturnType<typeof useTraderStore>, 'contract_type'>;

export type TItem = {
    id: string;
    title: string;
    icon?: React.ReactNode;
    is_popular?: boolean;
    show_fire_icon?: boolean;
};

export type TResultItem = {
    id: string;
    title?: string;
    button_title?: string;
    onButtonClick?: () => void;
    items: TItem[];
};

const TradeTypes = ({ contract_type, onTradeTypeSelect, trade_types, is_dark_mode_on }: TTradeTypesProps) => {
    const { localize } = useTranslations();
    const { isBridgeAvailable } = useMobileBridge();
    const { isMobile } = useDevice();
    const [is_open, setIsOpen] = React.useState<boolean>(false);
    const [is_editing, setIsEditing] = React.useState<boolean>(false);
    const [is_guide_open, setIsGuideOpen] = React.useState<boolean>(false);
    const [guide_key, setGuideKey] = React.useState<number>(0);
    const trade_types_ref = React.useRef<HTMLDivElement>(null);

    const createArrayFromCategories = (data: TTradeTypesProps['trade_types']): TItem[] => {
        const result: TItem[] = [];

        data.forEach(category => {
            const matchingContract = AVAILABLE_CONTRACTS.find(contract => contract.for.includes(category.value));

            result.push({
                id: category.value,
                title: category.text ?? '',
                is_popular: matchingContract?.is_popular,
                show_fire_icon: matchingContract?.show_fire_icon,
            });
        });

        return result;
    };

    const trade_types_array = useMemo(() => {
        return createArrayFromCategories(trade_types);
    }, [trade_types]);

    const trade_types_ids = useMemo(() => {
        return trade_types_array.map(type => type.id);
    }, [trade_types_array]);

    const saved_pinned_trade_types_string: string = localStorage.getItem('pinned_trade_types') ?? '[]';

    // Keep raw saved types for localStorage update
    const raw_saved_pinned_trade_types: TResultItem[] = useMemo(
        () => safeParse(saved_pinned_trade_types_string) ?? [],
        [saved_pinned_trade_types_string]
    );

    // Filter localStorage data immediately to prevent stale types from rendering in native mobile app
    const saved_pinned_trade_types: TResultItem[] = useMemo(() => {
        // Return empty array if trade_types_ids is not available to prevent showing stale types
        if (trade_types_ids.length === 0) return [];

        // Filter out unavailable trade types before component renders
        return raw_saved_pinned_trade_types.map((category: TResultItem) => ({
            ...category,
            items: category.items.filter((item: TItem) => trade_types_ids.includes(item.id)),
        }));
    }, [raw_saved_pinned_trade_types, trade_types_ids]);

    const [other_trade_types, setOtherTradeTypes] = useState<TResultItem[]>([]);
    const [pinned_trade_types, setPinnedTradeTypes] = useState<TResultItem[]>(saved_pinned_trade_types);

    // Sync localStorage with current available trade types to persist cleanup
    useEffect(() => {
        if (trade_types_array.length > 0 && raw_saved_pinned_trade_types.length > 0) {
            const filtered_pinned = raw_saved_pinned_trade_types.map((category: TResultItem) => ({
                ...category,
                items: category.items.filter((item: TItem) => trade_types_ids.includes(item.id)),
            }));

            // Only update localStorage if something changed to avoid unnecessary writes
            const current_items = raw_saved_pinned_trade_types.flatMap(type => type.items);
            const filtered_items = filtered_pinned.flatMap(type => type.items);

            const currentIds = new Set(current_items.map((item: TItem) => item.id));
            const filteredIds = new Set(filtered_items.map((item: TItem) => item.id));

            const hasChanged =
                currentIds.size !== filteredIds.size || ![...currentIds].every(id => filteredIds.has(id));

            if (hasChanged) {
                localStorage.setItem('pinned_trade_types', JSON.stringify(filtered_pinned));
            }
        }
    }, [trade_types_ids, trade_types_array.length, raw_saved_pinned_trade_types]);

    const getItems = (trade_types: TResultItem[]) => trade_types.flatMap(type => type.items);

    const filterItems = (items: TItem[], validTradeTypeIds: string[]): TItem[] => {
        return items.filter(item => validTradeTypeIds.includes(item.id));
    };

    const getPinnedItems = useCallback(() => {
        const pinned_items = filterItems(getItems(saved_pinned_trade_types), trade_types_ids);

        // Only use all trade types as fallback if we have valid trade_types_array
        // and trade_types_ids is populated (not during initial load)
        if (pinned_items.length === 0 && trade_types_ids.length > 0) {
            pinned_items.push(...trade_types_array.slice(0, trade_types_array.length));
        }
        return pinned_items;
    }, [saved_pinned_trade_types, trade_types_ids, trade_types_array]);

    const setTradeTypes = useCallback(() => {
        const pinned_items = getPinnedItems();

        const default_pinned_trade_types = [
            {
                id: 'pinned',
                title: localize('Pinned'),
                items: pinned_items,
            },
        ];

        const default_other_trade_types = [
            {
                id: 'other',
                items: trade_types_array.filter(item => !pinned_items.some(pinned_item => pinned_item.id === item.id)),
            },
        ];

        setPinnedTradeTypes(default_pinned_trade_types);
        setOtherTradeTypes(default_other_trade_types);
    }, [getPinnedItems, trade_types_array]);

    const scrollToSelectedTradeType = useCallback(() => {
        const timeoutId = setTimeout(() => {
            let position_x = 0;
            if (trade_types_ref.current) {
                const selected_chip = trade_types_ref.current.querySelector(
                    'button[data-state="selected"]'
                ) as HTMLButtonElement;
                if (selected_chip) {
                    position_x =
                        selected_chip.getBoundingClientRect().x -
                            (window.innerWidth - selected_chip.getBoundingClientRect().width) / 2 || 0;
                }
                trade_types_ref.current.scrollBy({
                    left: position_x,
                    top: 0,
                });
            }
        }, 0);

        return () => clearTimeout(timeoutId);
    }, []);

    useEffect(() => {
        setTradeTypes();
    }, [setTradeTypes]);

    useEffect(() => {
        const cleanup = scrollToSelectedTradeType();
        return cleanup;
    }, [scrollToSelectedTradeType]);

    const handleCloseTradeTypes = () => {
        setIsOpen(false);
        setIsEditing(false);
    };

    const handleCustomizeTradeTypes = () => {
        setIsEditing(true);
    };

    const handleAddPinnedClick = (item: TItem) => {
        setOtherTradeTypes(prev_categories => modifyCategories(prev_categories, item));
        setPinnedTradeTypes(prev_pinned => modifyPinnedCategories(prev_pinned, item, 'add'));
    };

    const handleRemovePinnedClick = (item: TItem) => {
        setPinnedTradeTypes(prev_categories => modifyCategories(prev_categories, item));
        setOtherTradeTypes(prev_others => modifyOtherCategories(prev_others, item));
    };

    const modifyPinnedCategories = (categories: TResultItem[], item: TItem, action: 'add' | 'remove') => {
        return categories.map(category => {
            if (category.id === 'pinned') {
                return {
                    ...category,
                    items: action === 'add' ? [...category.items, item] : category.items.filter(i => i.id !== item.id),
                };
            }
            return category;
        });
    };

    const modifyCategories = (categories: TResultItem[], item: TItem) =>
        categories.map(category => ({
            ...category,
            items: category.items.filter(i => i.id !== item.id),
        }));

    const modifyOtherCategories = (categories: TResultItem[], item: TItem) => {
        return categories.map(category => {
            if (category.id === 'other') {
                return {
                    ...category,
                    items: sortCategoriesInTradeTypeOrder(trade_types, [...category.items, item]),
                };
            }
            return category;
        });
    };

    const savePinnedToLocalStorage = () => {
        localStorage.setItem('pinned_trade_types', JSON.stringify(pinned_trade_types));
        setIsEditing(false);
    };

    const handleOnDrag = (categories: TResultItem[]) => {
        setPinnedTradeTypes(categories);
    };

    const handleOnTradeTypeSelect = (e: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => {
        onTradeTypeSelect(e, 'trade_type_page', getPinnedItems().length);
        scrollToSelectedTradeType();
        setIsOpen(false);
    };

    const handleOpenActionSheet = () => {
        setTradeTypes();
        setIsOpen(true);
    };

    const isTradeTypeSelected = (value: string) =>
        checkContractTypePrefix([contract_type, value]) || contract_type === value;

    // Memoize trade type chips to ensure they only update when dependencies change
    // and prevent rendering stale data from state
    const trade_type_chips = useMemo(() => {
        // Guard: Return empty array if no valid trade types to prevent showing stale data
        if (trade_types_ids.length === 0) return [];

        const pinned_items = getPinnedItems();
        const is_contract_type_in_pinned = pinned_items.some(item => item.id === contract_type);

        // Get other items, but filter them against trade_types_ids to prevent stale state data
        const filtered_other_items = getItems(other_trade_types).filter(item => trade_types_ids.includes(item.id));

        const other_item = !is_contract_type_in_pinned
            ? filtered_other_items.find(
                  item => item && (item.id === contract_type || checkContractTypePrefix([item.id, contract_type]))
              )
            : null;

        // Final filter to only include items that exist in current trade_types
        return [...pinned_items, other_item].filter(item => item && trade_types_ids.includes(item.id)) as TItem[];
    }, [trade_types_ids, getPinnedItems, other_trade_types, contract_type]);

    const should_show_view_all =
        (trade_type_chips.length >= 2 || getItems(other_trade_types).length > 0) && !isBridgeAvailable && isMobile;
    const show_trade_type_list_divider = !!other_trade_types[0]?.items?.length;
    const show_editing_divider = trade_types_array.length !== pinned_trade_types[0]?.items?.length;
    const trade_type_content_props = {
        handleCustomizeTradeTypes,
        handleRemovePinnedClick,
        handleOnDrag,
        handleOnTradeTypeSelect,
        handleAddPinnedClick,
        is_editing,
        is_dark_mode_on,
        isTradeTypeSelected,
        savePinnedToLocalStorage,
        show_trade_type_list_divider,
        show_editing_divider,
        other_trade_types,
        pinned_trade_types,
    };

    const action_sheet_content = [
        {
            id: 1,
            component: <TradeTypesContent {...trade_type_content_props} />,
        },
        {
            id: 2,
            component: <Guide show_trigger_button={false} is_open_by_default show_description_in_a_modal={false} />,
        },
    ];

    if (trade_types_ids.length === 0) {
        return (
            <div className='trade__trade-types'>
                <Skeleton width={88} height={32} />
            </div>
        );
    }

    return (
        <div className='trade__trade-types' ref={trade_types_ref}>
            <TradeTypesSelector
                available_contracts={AVAILABLE_CONTRACTS.filter(contract =>
                    trade_types.some(tt => contract.for.includes(tt.value))
                )}
                selected_trade_type={contract_type}
                onTradeTypeSelect={(type: string, tab: 'all' | 'most_traded') => {
                    const trade_type_text = trade_types.find(tt => tt.value === type)?.text || type;
                    const synthetic_event = {
                        target: { textContent: trade_type_text },
                        currentTarget: { textContent: trade_type_text },
                    } as unknown as React.MouseEvent<HTMLElement>;
                    onTradeTypeSelect(synthetic_event, 'trade_types_selector', getPinnedItems().length, tab);
                }}
                onGuideClick={() => {
                    setIsGuideOpen(true);
                    setGuideKey(prev => prev + 1);
                }}
            />
            {trade_type_chips.map(({ title, id, show_fire_icon }: TItem) => (
                <Chip.Selectable
                    key={id}
                    onChipSelect={e => {
                        const synthetic_event = {
                            ...e,
                            target: { ...e.target, textContent: title },
                            currentTarget: { ...e.currentTarget, textContent: title },
                        } as React.MouseEvent<HTMLElement>;
                        onTradeTypeSelect(synthetic_event, 'main_trade_page', getPinnedItems().length);
                    }}
                    selected={isTradeTypeSelected(id)}
                >
                    <Text size='sm'>
                        {title}
                        {show_fire_icon && <FireIcon />}
                    </Text>
                </Chip.Selectable>
            ))}
            {should_show_view_all && !isBridgeAvailable && (
                <Button
                    key='trade-types-all'
                    onClick={handleOpenActionSheet}
                    variant='tertiary'
                    className='trade__trade-types-header'
                    color={is_dark_mode_on ? 'white' : 'black'}
                >
                    <Text size='sm' bold underlined color='var(--component-button-label-color-blackWhite-tertiary)'>
                        <Localize i18n_default_text='View all' />
                    </Text>
                </Button>
            )}
            <ActionSheet.Root
                className={clsx('trade-types-dialog', {
                    'trade-types-dialog--is_editing': is_editing,
                })}
                isOpen={is_open}
                expandable={false}
                onClose={handleCloseTradeTypes}
            >
                <ActionSheet.Portal shouldCloseOnDrag>
                    {is_editing ? (
                        <React.Fragment>
                            <ActionSheet.Header
                                title={
                                    <div className='trade-types-dialog__title'>
                                        <Localize i18n_default_text='Trade types' />
                                    </div>
                                }
                            />
                            <TradeTypesContent {...trade_type_content_props} />
                        </React.Fragment>
                    ) : (
                        <Carousel
                            header={CarouselHeader}
                            pages={action_sheet_content}
                            title={<Localize i18n_default_text='Trade types' />}
                            next_icon={LabelPairedPresentationScreenSmRegularIcon}
                            onNextButtonClick={() => {}}
                        />
                    )}
                </ActionSheet.Portal>
            </ActionSheet.Root>
            {/* TradeTypesSelectionGuide now only shows for mobile users */}
            {is_open && <TradeTypesSelectionGuide is_dark_mode_on={is_dark_mode_on} />}
            {is_guide_open && (
                <Guide
                    key={guide_key}
                    show_trigger_button={false}
                    is_open_by_default={true}
                    show_description_in_a_modal={true}
                    show_all_trade_types_in_guide={true}
                />
            )}
        </div>
    );
};

export default React.memo(TradeTypes);
