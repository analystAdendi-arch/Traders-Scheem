import React from 'react';

import { LabelPairedChevronRightSmRegularIcon } from '@deriv/quill-icons';
import { observer, useStore } from '@deriv/stores';
import { Button, Text } from '@deriv-com/quill-ui';
import { Localize } from '@deriv-com/translations';
import { useDevice } from '@deriv-com/ui';

import useAvailableContracts from 'AppV2/Hooks/useAvailableContracts';
import useGuideContractTypes from 'AppV2/Hooks/useGuideContractTypes';
import { CONTRACT_LIST } from 'AppV2/Utils/trade-types-utils';
import ImageGuide from 'Assets/SvgComponents/trade_explanations/img-guide.svg';
import { useTraderStore } from 'Stores/useTraderStores';

import GuideDefinitionModal from './guide-definition-modal';
import GuideDescriptionModal from './guide-description-modal';

import './guide.scss';

type TGuide = {
    is_open_by_default?: boolean;
    show_guide_for_selected_contract?: boolean;
    show_trigger_button?: boolean;
    show_description_in_a_modal?: boolean;
    show_all_trade_types_in_guide?: boolean;
};

const Guide = observer(
    ({
        is_open_by_default,
        show_guide_for_selected_contract,
        show_trigger_button = true,
        show_description_in_a_modal = true,
        show_all_trade_types_in_guide,
    }: TGuide) => {
        const {
            ui: { is_dark_mode_on },
            common: { current_language },
        } = useStore();
        const { contract_type } = useTraderStore();
        const { isMobile } = useDevice();
        const available_contracts = useAvailableContracts();
        const contract_type_title = available_contracts.find(item => item.for.includes(contract_type))?.id ?? '';
        const { trade_types } = useGuideContractTypes();
        const order = [
            CONTRACT_LIST.RISE_FALL,
            CONTRACT_LIST.ACCUMULATORS,
            CONTRACT_LIST.MULTIPLIERS,
            CONTRACT_LIST.VANILLAS,
            CONTRACT_LIST.TURBOS,
            CONTRACT_LIST.HIGHER_LOWER,
            CONTRACT_LIST.TOUCH_NO_TOUCH,
            CONTRACT_LIST.MATCHES_DIFFERS,
            CONTRACT_LIST.EVEN_ODD,
            CONTRACT_LIST.OVER_UNDER,
        ];

        const filtered_contract_list = available_contracts.filter(contract =>
            trade_types.some((trade: { text?: string }) => trade.text === contract.id)
        );

        const ordered_contract_list = [...filtered_contract_list].sort(
            (a, b) => order.findIndex(item => item === a.id) - order.findIndex(item => item === b.id)
        );

        const [is_description_opened, setIsDescriptionOpened] = React.useState(is_open_by_default);
        const [selected_contract_type, setSelectedContractType] = React.useState(contract_type_title);
        const [selected_term, setSelectedTerm] = React.useState<string>('');

        const onChipSelect = React.useCallback((id: string) => setSelectedContractType(id ?? ''), []);

        const onClose = React.useCallback(() => setIsDescriptionOpened(false), []);

        React.useEffect(() => {
            if (show_guide_for_selected_contract) setSelectedContractType(contract_type_title);
        }, [show_guide_for_selected_contract, contract_type_title]);

        React.useEffect(() => {
            setIsDescriptionOpened(is_description_opened);
            // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [is_open_by_default]);

        return (
            <React.Fragment>
                {show_trigger_button &&
                    (isMobile ? (
                        <Button
                            color={is_dark_mode_on ? 'white' : 'black'}
                            className='trade__guide'
                            onClick={() => {
                                setIsDescriptionOpened(true);
                            }}
                            variant='tertiary'
                            key={current_language}
                        >
                            <ImageGuide />
                        </Button>
                    ) : (
                        <div
                            className='guide-link'
                            onClick={() => {
                                setIsDescriptionOpened(true);
                            }}
                        >
                            <Text size='sm' color='quill-typography__color--prominent'>
                                <Localize
                                    i18n_default_text='How to trade {{trade_type}}?'
                                    values={{ trade_type: contract_type_title || 'this' }}
                                />
                            </Text>
                            <LabelPairedChevronRightSmRegularIcon />
                        </div>
                    ))}
                <GuideDescriptionModal
                    contract_list={ordered_contract_list}
                    is_dark_mode_on={is_dark_mode_on}
                    is_open={is_description_opened}
                    onChipSelect={(id: string) => {
                        onChipSelect(id);
                    }}
                    onClose={onClose}
                    onTermClick={setSelectedTerm}
                    selected_contract_type={selected_contract_type}
                    show_guide_for_selected_contract={show_guide_for_selected_contract}
                    show_description_in_a_modal={show_description_in_a_modal}
                    show_all_trade_types_in_guide={show_all_trade_types_in_guide}
                />
                {isMobile && (
                    <GuideDefinitionModal
                        contract_type={selected_contract_type}
                        term={selected_term}
                        onClose={() => setSelectedTerm('')}
                    />
                )}
            </React.Fragment>
        );
    }
);

export default Guide;
