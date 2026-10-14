import React from 'react';
import { TransitionGroup } from 'react-transition-group';
import {
    AutoSizer as _AutoSizer,
    type AutoSizerProps,
    CellMeasurer as _CellMeasurer,
    CellMeasurerCache,
    CellMeasurerProps,
    IndexRange,
    List as _List,
    ListProps,
    ListRowProps,
} from 'react-virtualized';
import { MeasuredCellParent } from 'react-virtualized/dist/es/CellMeasurer';
import classNames from 'classnames';

import { isDesktop, isMobile } from '@deriv/shared';

import ThemedScrollbars from '../themed-scrollbars';
import { TPassThrough, TRow, TTableRowItem } from '../types/common.types';

import DataListCell from './data-list-cell';
import DataListRow, { TRowRenderer } from './data-list-row';

const List = _List as unknown as React.FC<ListProps>;
const AutoSizer = _AutoSizer as unknown as React.FC<AutoSizerProps>;
const CellMeasurer = _CellMeasurer as unknown as React.FC<CellMeasurerProps>;

export type TDataList = {
    className?: string;
    data_source: TRow[];
    footer?: TRow;
    getRowAction?: (row: TRow) => TTableRowItem;
    getRowSize?: (params: { index: number }) => number;
    keyMapper?: (row: TRow) => number | string;
    onRowsRendered?: (params: IndexRange) => void;
    onScroll?: React.UIEventHandler<HTMLDivElement>;
    passthrough?: TPassThrough;
    row_gap?: number;
    setListRef?: (ref: MeasuredCellParent) => void;
    rowRenderer: TRowRenderer;
    children?: React.ReactNode;
    overscanRowCount?: number;
};
type GetContentType = { measure?: () => void | undefined };

const DataList = React.memo(
    ({
        children,
        className,
        data_source,
        footer,
        getRowSize,
        keyMapper,
        onRowsRendered,
        onScroll,
        setListRef,
        overscanRowCount,
        ...other_props
    }: TDataList) => {
        const [is_loading, setLoading] = React.useState(true);
        const [is_scrolling, setIsScrolling] = React.useState(false);
        const [scroll_top, setScrollTop] = React.useState(0);

        const cache = React.useRef<CellMeasurerCache>();
        const list_ref = React.useRef<MeasuredCellParent | null>(null);
        const items_transition_map_ref = React.useRef<{ [key: string]: boolean }>({});
        const data_source_ref = React.useRef<TRow[] | null>(null);
        const scroll_timeout_ref = React.useRef<ReturnType<typeof setTimeout>>();
        data_source_ref.current = data_source;

        const is_dynamic_height = !getRowSize;

        const trackItemsForTransition = React.useCallback(() => {
            data_source.forEach((item: TRow, index: number) => {
                const row_key: string | number = keyMapper?.(item) || `${index}-0`;
                items_transition_map_ref.current[row_key] = true;
            });
        }, [data_source, keyMapper]);

        const prev_data_length_ref = React.useRef(0);
        const prev_data_keys_ref = React.useRef<(string | number)[]>([]);

        React.useEffect(() => {
            if (is_dynamic_height) {
                cache.current = new CellMeasurerCache({
                    fixedWidth: true,
                    keyMapper: row_index => {
                        if (data_source_ref?.current && row_index < data_source_ref?.current.length)
                            return keyMapper?.(data_source_ref.current[row_index]) || row_index;
                        return row_index;
                    },
                });
            }
            trackItemsForTransition();
            prev_data_length_ref.current = data_source.length;
            prev_data_keys_ref.current = data_source.map((item, index) => keyMapper?.(item) || index);
            setLoading(false);
        }, []); // eslint-disable-line react-hooks/exhaustive-deps

        React.useEffect(() => {
            trackItemsForTransition();

            // Only recompute grid size if data actually changed (length or items)
            // This prevents expensive recalculation on every array reference change
            const current_length = data_source.length;
            const length_changed = prev_data_length_ref.current !== current_length;

            // Only compute keys if length matches (avoid unnecessary map operation)
            let items_changed = length_changed;
            let current_keys: (string | number)[] | undefined;

            if (!items_changed && current_length > 0) {
                // Only compute keys if lengths match and array is not empty
                current_keys = data_source.map((item, index) => keyMapper?.(item) || index);
                items_changed = current_keys.some((key, index) => prev_data_keys_ref.current[index] !== key);
            }

            if (items_changed && is_dynamic_height) {
                // Compute keys if not already computed
                if (!current_keys) {
                    current_keys = data_source.map((item, index) => keyMapper?.(item) || index);
                }

                list_ref.current?.recomputeGridSize?.({ columnIndex: 0, rowIndex: 0 });
                prev_data_length_ref.current = current_length;
                prev_data_keys_ref.current = current_keys;
            }
        }, [data_source, is_dynamic_height, trackItemsForTransition, keyMapper]);

        const footerRowRenderer = () => {
            return <React.Fragment>{other_props.rowRenderer({ row: footer, is_footer: true })}</React.Fragment>;
        };

        const rowRenderer = ({ style, index, key, parent }: ListRowProps) => {
            const { getRowAction, passthrough, row_gap } = other_props;
            const row = data_source[index];
            const { action_type, shortcode, purchase_time, transaction_time, id } = row;
            const action = getRowAction && getRowAction(row);
            const destination_link = typeof action === 'string' ? action : undefined;
            const action_desc = typeof action === 'object' ? action : undefined;
            const row_key = keyMapper?.(row) || key;

            const getContent = ({ measure }: GetContentType = {}) => (
                <DataListRow
                    //@ts-expect-error needs refactor
                    action_desc={action_desc}
                    destination_link={destination_link}
                    is_new_row={!items_transition_map_ref.current[row_key]}
                    is_scrolling={is_scrolling}
                    measure={measure}
                    passthrough={passthrough}
                    row_gap={row_gap}
                    row_key={row_key}
                    row={row}
                    rowRenderer={other_props.rowRenderer}
                    is_dynamic_height={is_dynamic_height}
                />
            );

            return is_dynamic_height && cache.current ? (
                <CellMeasurer cache={cache.current} columnIndex={0} key={row_key} rowIndex={index} parent={parent}>
                    {({ measure }) => <div style={style}>{getContent({ measure })}</div>}
                </CellMeasurer>
            ) : (
                <div key={row_key} style={style}>
                    {getContent()}
                </div>
            );
        };

        const handleScroll = (ev: Partial<React.UIEvent<HTMLDivElement>>) => {
            clearTimeout(scroll_timeout_ref.current);
            if (!is_scrolling) {
                setIsScrolling(true);
            }
            scroll_timeout_ref.current = setTimeout(() => {
                if (!is_loading) {
                    setIsScrolling(false);
                }
            }, 200);

            setScrollTop((ev.target as HTMLElement).scrollTop);
            if (typeof onScroll === 'function') {
                onScroll(ev as React.UIEvent<HTMLDivElement>);
            }
        };

        const setRef = (ref: MeasuredCellParent) => {
            list_ref.current = ref;
            setListRef?.(ref);
        };

        if (is_loading) {
            return <div />;
        }
        return (
            <div
                data-testid='dt_data_list'
                className={classNames(className, 'data-list', {
                    [`${className}__data-list`]: className,
                })}
            >
                <div className='data-list__body-wrapper'>
                    <div className={classNames('data-list__body', { [`${className}__data-list-body`]: className })}>
                        <AutoSizer>
                            {({ width, height }) => (
                                // Don't remove `TransitionGroup`. When `TransitionGroup` is removed, transition life cycle events like `onEntered` won't be fired sometimes on it's `CSSTransition` children
                                <TransitionGroup style={{ height, width }}>
                                    <ThemedScrollbars onScroll={handleScroll} autohide is_bypassed={isMobile()}>
                                        <List
                                            className={className}
                                            deferredMeasurementCache={cache?.current}
                                            height={height}
                                            onRowsRendered={onRowsRendered}
                                            overscanRowCount={overscanRowCount || 1}
                                            ref={(ref: MeasuredCellParent) => setRef(ref)}
                                            rowCount={data_source.length}
                                            rowHeight={
                                                is_dynamic_height && cache?.current?.rowHeight
                                                    ? cache?.current?.rowHeight
                                                    : getRowSize || 0
                                            }
                                            rowRenderer={rowRenderer}
                                            scrollingResetTimeInterval={0}
                                            width={width}
                                            {...(isDesktop()
                                                ? { scrollTop: scroll_top, autoHeight: true }
                                                : {
                                                      onScroll: target =>
                                                          handleScroll({ target } as unknown as Partial<
                                                              React.UIEvent<HTMLDivElement>
                                                          >),
                                                  })}
                                        />
                                    </ThemedScrollbars>
                                </TransitionGroup>
                            )}
                        </AutoSizer>
                    </div>
                    {children}
                </div>
                {footer && (
                    <div
                        className={classNames('data-list__footer', {
                            [`${className}__data-list-footer`]: className,
                        })}
                    >
                        {footerRowRenderer()}
                    </div>
                )}
            </div>
        );
    }
) as React.MemoExoticComponent<(props: TDataList) => JSX.Element> & { Cell: typeof DataListCell };

DataList.displayName = 'DataList';
DataList.Cell = DataListCell;

export default DataList;
