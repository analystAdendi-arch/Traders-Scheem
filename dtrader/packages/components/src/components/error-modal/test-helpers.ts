/**
 * Shared test utilities for error modal tests
 */

/**
 * Sets up the modal root element in the DOM for testing
 * @returns The created modal root element
 */
export const setupModalRoot = (): HTMLDivElement => {
    const modal_root_el = document.createElement('div');
    modal_root_el.setAttribute('id', 'modal_root');
    document.body.appendChild(modal_root_el);
    return modal_root_el;
};

/**
 * Cleans up the modal root element from the DOM after testing
 * @param modal_root_el The modal root element to remove
 */
export const cleanupModalRoot = (modal_root_el: HTMLDivElement): void => {
    document.body.removeChild(modal_root_el);
};
