# InputPopover & ValueChips Components

Reusable components for creating popover-based input interfaces with quick value selection.

## Components

### InputPopover

A reusable popover wrapper that handles overlay, positioning, and content rendering.

**Props:**

- `isOpen` (boolean, required): Controls popover visibility
- `onClose` (function, required): Callback when popover should close
- `triggerRef` (React.RefObject, required): Reference to the trigger element for positioning
- `children` (React.ReactNode, required): Content to render inside popover
- `className` (string, optional): Additional CSS class for popover
- `popoverWidth` (number, optional): Width in pixels (default: 280)
- `spacing` (number, optional): Gap from trigger element in pixels (default: 16)

**Example:**

```tsx
import { InputPopover } from 'AppV2/Components/InputPopover';

const MyComponent = () => {
    const [isOpen, setIsOpen] = React.useState(false);
    const triggerRef = React.useRef<HTMLDivElement>(null);

    return (
        <>
            <div ref={triggerRef} onClick={() => setIsOpen(true)}>
                Click me
            </div>
            <InputPopover isOpen={isOpen} onClose={() => setIsOpen(false)} triggerRef={triggerRef}>
                <YourContent />
            </InputPopover>
        </>
    );
};
```

---

### ValueChips

A configurable chip selector for quick value selection.

**Props:**

- `values` (number[], required): Array of values to display as chips
- `selectedValue` (number, optional): Currently selected value
- `onSelect` (function, required): Callback when a chip is selected
- `formatValue` (function, optional): Custom formatter for chip display
- `className` (string, optional): Additional CSS class for container
- `chipClassName` (string, optional): Additional CSS class for individual chips

**Example:**

```tsx
import { ValueChips } from 'AppV2/Components/InputPopover';
import { getCurrencyDisplayCode } from '@deriv/shared';

const STAKE_VALUES = [1, 5, 10, 15, 20, 25, 30, 40, 50, 100];

const StakeChips = ({ currency, amount, onChange }) => {
    return (
        <ValueChips
            values={STAKE_VALUES}
            selectedValue={amount}
            onSelect={onChange}
            formatValue={val => `${val} ${getCurrencyDisplayCode(currency)}`}
        />
    );
};
```

---

### usePopoverPosition Hook

Custom hook for calculating popover position relative to trigger element.

**Props:**

- `triggerRef` (React.RefObject, required): Reference to trigger element
- `isOpen` (boolean, required): Whether popover is open
- `popoverWidth` (number, optional): Width in pixels (default: 280)
- `spacing` (number, optional): Gap from trigger in pixels (default: 16)

**Returns:**

- `{ top: number, left: number }`: Position coordinates

**Example:**

```tsx
import { usePopoverPosition } from 'AppV2/Components/InputPopover';

const position = usePopoverPosition({
    triggerRef,
    isOpen,
    popoverWidth: 300,
    spacing: 20,
});
```

---

## Styling

### Base Styles

The components come with base styles that use CSS variables for theming:

**InputPopover:**

- `.input-popover-overlay`: Fixed overlay
- `.input-popover`: Popover container

**ValueChips:**

- `.value-chips`: Container
- `.value-chips__grid`: 2-column grid layout
- `.value-chips__chip`: Individual chip button
- `.value-chips__chip--selected`: Selected chip state

### Extending Styles

You can extend the base styles in your component-specific SCSS:

```scss
@import '../InputPopover/input-popover.scss';
@import '../InputPopover/value-chips.scss';

.my-custom-popover {
    @extend .input-popover;
    // Add custom styles
    height: 40rem;
}

.my-custom-chips {
    @extend .value-chips;
    // Add custom styles
    padding: 2rem;
}
```

---

## Complete Example: Stake Field

```tsx
import React from 'react';
import { getCurrencyDisplayCode } from '@deriv/shared';
import { TextField, SegmentedControlSingleChoice } from '@deriv-com/quill-ui';
import { InputPopover, ValueChips } from 'AppV2/Components/InputPopover';

const STAKE_VALUES = [1, 5, 10, 15, 20, 25, 30, 40, 50, 100];

const StakeField = ({ amount, currency, onChange }) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('chips');
    const triggerRef = React.useRef<HTMLDivElement>(null);

    const handleChipSelect = (value: number) => {
        onChange(value);
        setIsOpen(false);
    };

    return (
        <>
            <div ref={triggerRef}>
                <TextField
                    value={`${amount} ${getCurrencyDisplayCode(currency)}`}
                    onClick={() => setIsOpen(true)}
                    readOnly
                />
            </div>

            <InputPopover
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                triggerRef={triggerRef}
                className='stake-popover'
            >
                <div className='stake-popover__header'>
                    <SegmentedControlSingleChoice
                        options={[
                            { label: 'Quick', value: 'chips' },
                            { label: 'Custom', value: 'input' },
                        ]}
                        selectedItemIndex={activeTab === 'chips' ? 0 : 1}
                        onChange={index => setActiveTab(index === 0 ? 'chips' : 'input')}
                    />
                </div>

                <div className='stake-popover__content'>
                    {activeTab === 'chips' ? (
                        <ValueChips
                            values={STAKE_VALUES}
                            selectedValue={amount}
                            onSelect={handleChipSelect}
                            formatValue={val => `${val} ${getCurrencyDisplayCode(currency)}`}
                        />
                    ) : (
                        <CustomInput amount={amount} onChange={onChange} />
                    )}
                </div>
            </InputPopover>
        </>
    );
};
```

---

## Features

✅ **Reusable**: Use for any input field requiring quick value selection  
✅ **Configurable**: Customize chip values, formatting, and styling  
✅ **Theme-aware**: Uses CSS variables for automatic theme support  
✅ **Accessible**: Includes proper ARIA labels  
✅ **Responsive**: Automatically repositions on window resize  
✅ **Type-safe**: Full TypeScript support

---

## Future Enhancements

- Support for right/top/bottom positioning
- Animation transitions
- Keyboard navigation
- Touch gesture support
- Custom grid layouts (3-column, 4-column, etc.)
