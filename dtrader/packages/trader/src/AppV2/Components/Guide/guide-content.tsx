import React from 'react';
import clsx from 'clsx';

import { Chip, Text } from '@deriv-com/quill-ui';

import FireIcon from 'AppV2/Components/FireIcon';

import TradeDescription from './Description/trade-description';
import VideoPreview from './Description/video-preview';

type TGuideContent = {
    contract_list: { tradeType: React.ReactNode; id: string; show_fire_icon?: boolean }[];
    onChipSelect: (id: string) => void;
    onTermClick: (term: string) => void;
    selected_contract_type: string;
    show_guide_for_selected_contract?: boolean;
    show_description_in_a_modal?: boolean;
    show_all_trade_types_in_guide?: boolean;
    toggleVideoPlayer?: (e?: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>) => void;
    video_src: string;
};

const GuideContent = ({
    contract_list,
    onChipSelect,
    onTermClick,
    selected_contract_type,
    show_guide_for_selected_contract,
    show_description_in_a_modal = true,
    show_all_trade_types_in_guide,
    toggleVideoPlayer,
    video_src,
}: TGuideContent) => (
    <React.Fragment>
        {(show_all_trade_types_in_guide || !show_guide_for_selected_contract) && (
            <div className='guide__menu'>
                {contract_list.map(
                    ({
                        tradeType,
                        id,
                        show_fire_icon,
                    }: {
                        tradeType: React.ReactNode;
                        id: string;
                        show_fire_icon?: boolean;
                    }) => (
                        <Chip.Selectable
                            key={id}
                            onChipSelect={() => onChipSelect(id)}
                            selected={id === selected_contract_type}
                        >
                            <Text size='sm'>
                                {tradeType}
                                {show_fire_icon && <FireIcon />}
                            </Text>
                        </Chip.Selectable>
                    )
                )}
            </div>
        )}
        <div
            className={clsx('guide__contract-description', {
                'guide__contract-description--without-btn': !show_description_in_a_modal,
            })}
            key={selected_contract_type}
        >
            <TradeDescription contract_type={selected_contract_type} onTermClick={onTermClick} />
            <VideoPreview
                contract_type={selected_contract_type}
                toggleVideoPlayer={toggleVideoPlayer}
                video_src={video_src}
            />
        </div>
    </React.Fragment>
);

export default GuideContent;
