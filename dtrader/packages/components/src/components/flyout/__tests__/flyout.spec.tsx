import React from 'react';

import { fireEvent, render, screen } from '@testing-library/react';

import Flyout from '../flyout';

jest.mock('@deriv/quill-icons', () => ({
    ...jest.requireActual('@deriv/quill-icons'),
    LegacyMinimize2pxIcon: () => 'LegacyMinimize2pxIcon',
}));

describe('<Flyout />', () => {
    const mockOnClose = jest.fn();
    const defaultProps = {
        is_open: true,
        onClose: mockOnClose,
        children: <div>Flyout Content</div>,
    };

    beforeEach(() => {
        mockOnClose.mockClear();
    });

    it('should render children when is_open is true', () => {
        render(<Flyout {...defaultProps} />);
        expect(screen.getByText('Flyout Content')).toBeInTheDocument();
    });

    it('should have proper ARIA attributes', () => {
        render(<Flyout {...defaultProps} title='Test Title' />);
        const flyoutElement = screen.getByRole('dialog');
        expect(flyoutElement).toHaveAttribute('aria-labelledby', 'flyout-title');
        expect(flyoutElement).toHaveAttribute('aria-hidden', 'false');
        expect(flyoutElement).toHaveAttribute('aria-modal', 'true');
    });

    it('should set aria-hidden to true when is_open is false', () => {
        render(<Flyout {...defaultProps} is_open={false} />);
        const flyoutElement = screen.getByRole('dialog', { hidden: true });
        expect(flyoutElement).toHaveAttribute('aria-hidden', 'true');
    });

    it('should apply dc-flyout--open class when is_open is true', () => {
        render(<Flyout {...defaultProps} />);
        const flyoutElement = screen.getByRole('dialog');
        expect(flyoutElement).toHaveClass('dc-flyout--open');
    });

    it('should not apply dc-flyout--open class when is_open is false', () => {
        render(<Flyout {...defaultProps} is_open={false} />);
        const flyoutElement = screen.getByRole('dialog', { hidden: true });
        expect(flyoutElement).not.toHaveClass('dc-flyout--open');
    });

    it('should render title in header with proper id when provided', () => {
        render(<Flyout {...defaultProps} title='Test Title' />);
        const titleElement = screen.getByText('Test Title');
        expect(titleElement).toBeInTheDocument();
        expect(titleElement).toHaveAttribute('id', 'flyout-title');
    });

    it('should render close button with accessibility label when title is provided', () => {
        render(<Flyout {...defaultProps} title='Test Title' />);
        const closeButton = screen.getByRole('button', { name: /close flyout/i });
        expect(closeButton).toBeInTheDocument();
        expect(closeButton).toHaveAttribute('aria-label', 'Close flyout');
        expect(closeButton).toHaveAttribute('type', 'button');
    });

    it('should call onClose when close button is clicked', () => {
        render(<Flyout {...defaultProps} title='Test Title' />);
        const closeButton = screen.getByRole('button', { name: /close flyout/i });
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should render custom header_content when provided', () => {
        const customHeader = <div>Custom Header</div>;
        render(<Flyout {...defaultProps} header_content={customHeader} />);
        expect(screen.getByText('Custom Header')).toBeInTheDocument();
    });

    it('should not render default header when header_content is provided', () => {
        const customHeader = <div>Custom Header</div>;
        render(<Flyout {...defaultProps} title='Test Title' header_content={customHeader} />);
        expect(screen.queryByText('Test Title')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /close flyout/i })).not.toBeInTheDocument();
    });

    it('should render footer_content when provided', () => {
        const footer = <div>Footer Content</div>;
        render(<Flyout {...defaultProps} footer_content={footer} />);
        expect(screen.getByText('Footer Content')).toBeInTheDocument();
    });

    it('should not render footer section when footer_content is not provided', () => {
        render(<Flyout {...defaultProps} />);
        expect(screen.queryByText(/footer/i)).not.toBeInTheDocument();
    });

    it('should apply dc-flyout__body--with-footer class when footer_content exists', () => {
        const footer = <div data-testid='footer-content'>Footer Content</div>;
        render(<Flyout {...defaultProps} footer_content={footer} />);
        expect(screen.getByTestId('footer-content')).toBeInTheDocument();
    });

    it('should apply custom className when provided', () => {
        render(<Flyout {...defaultProps} className='custom-class' />);
        const flyoutElement = screen.getByRole('dialog');
        expect(flyoutElement).toHaveClass('custom-class');
        expect(flyoutElement).toHaveClass('dc-flyout');
    });

    it('should render multiple children correctly', () => {
        render(
            <Flyout {...defaultProps}>
                <div>Child 1</div>
                <div>Child 2</div>
            </Flyout>
        );
        expect(screen.getByText('Child 1')).toBeInTheDocument();
        expect(screen.getByText('Child 2')).toBeInTheDocument();
    });
});
