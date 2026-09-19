import { useCallback, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ai-scanner-button.scss';

export interface TAIScannerButtonProps {
    onClick?: () => void;
}

const CLICK_THRESHOLD_PX = 5;
const POINTER_BUTTON_PRIMARY = 0;

const AIScannerButton = ({ onClick }: TAIScannerButtonProps) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const draggedRef = useRef<boolean>(false);
    const shouldClickOnReleaseRef = useRef<boolean>(false);
    const pointerIdRef = useRef<number | null>(null);
    const dragStartPointerRef = useRef<{ x: number; y: number } | null>(null);
    const dragStartRectRef = useRef<DOMRect | null>(null);
    const dragStartPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const navigate = useNavigate();
    const location = useLocation();

    const defaultNavigateToAnalysisTool = useCallback(() => {
        navigate({
            pathname: location.pathname,
            search: location.search,
            hash: 'analysis_tool',
        });
    }, [location.pathname, location.search, navigate]);

    const performClick = useCallback(() => {
        (onClick ?? defaultNavigateToAnalysisTool)();
    }, [defaultNavigateToAnalysisTool, onClick]);

    const handlePointerDown = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (e.button !== POINTER_BUTTON_PRIMARY) return;
            const node = nodeRef.current;
            if (!node) return;

            draggedRef.current = false;
            shouldClickOnReleaseRef.current = true;
            pointerIdRef.current = e.pointerId;
            dragStartPointerRef.current = { x: e.clientX, y: e.clientY };
            dragStartRectRef.current = node.getBoundingClientRect();
            dragStartPositionRef.current = position;

            try {
                node.setPointerCapture(e.pointerId);
            } catch (_) {}
        },
        [position]
    );

    const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (pointerIdRef.current !== e.pointerId) return;
        const startPointer = dragStartPointerRef.current;
        const startRect = dragStartRectRef.current;
        if (!startPointer || !startRect) return;

        const dx = e.clientX - startPointer.x;
        const dy = e.clientY - startPointer.y;

        if (!draggedRef.current && (Math.abs(dx) > CLICK_THRESHOLD_PX || Math.abs(dy) > CLICK_THRESHOLD_PX)) {
            draggedRef.current = true;
            shouldClickOnReleaseRef.current = false;
        }

        const vw = window.innerWidth;
        const vh = window.innerHeight;

        const minDx = -startRect.left;
        const maxDx = vw - startRect.right;
        const minDy = -startRect.top;
        const maxDy = vh - startRect.bottom;

        const clampedDx = Math.min(maxDx, Math.max(minDx, dx));
        const clampedDy = Math.min(maxDy, Math.max(minDy, dy));

        setPosition({
            x: dragStartPositionRef.current.x + clampedDx,
            y: dragStartPositionRef.current.y + clampedDy,
        });
    }, []);

    const handlePointerEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
        if (pointerIdRef.current !== e.pointerId) return;

        const wasClick = shouldClickOnReleaseRef.current && !draggedRef.current;

        pointerIdRef.current = null;
        dragStartPointerRef.current = null;
        dragStartRectRef.current = null;
        draggedRef.current = false;
        shouldClickOnReleaseRef.current = false;

        try {
            nodeRef.current?.releasePointerCapture(e.pointerId);
        } catch (_) {}

        if (wasClick) {
            window.setTimeout(() => performClick(), 0);
        }
    }, [performClick]);

    const handleButtonClickCapture = useCallback(
        (e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            e.preventDefault();
        },
        []
    );

    return (
        <div
            className='ai-scanner-button__wrapper'
            ref={nodeRef}
            role='button'
            tabIndex={0}
            aria-label='AI Scanner'
            style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
            onClick={performClick}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerEnd}
            onPointerCancel={handlePointerEnd}
            onKeyDown={e => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    performClick();
                }
            }}
        >
            <div className='ai-scanner-button__button-wrap'>
                <button
                    type='button'
                    className='ai-scanner-button__button'
                    tabIndex={-1}
                    aria-hidden='true'
                    onClickCapture={handleButtonClickCapture}
                >
                    AI
                </button>
            </div>
            <div className='ai-scanner-button__tooltip'>{'AI Scanner - Click to analyze'}</div>
        </div>
    );
};

export default AIScannerButton;
