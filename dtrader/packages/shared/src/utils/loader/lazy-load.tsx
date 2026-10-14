import React from 'react';

/**
 * Creates a lazy-loaded component using React.lazy and Suspense
 * @param importFn - Function that returns a dynamic import promise
 * @param loaderFn - Function that returns a loading component
 * @param component_name - Optional: name of a named export from the module
 * @returns A lazy-loaded React component wrapped with Suspense
 */
export const makeLazyLoader =
    (importFn: () => Promise<unknown>, loaderFn: () => JSX.Element) => (component_name?: string) => {
        const LazyComponent = React.lazy(async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const module = (await importFn()) as { default: Record<string, any> };

            // Handle named exports if component_name is provided
            if (component_name) {
                const NamedComponent = module.default[component_name];
                return { default: NamedComponent };
            }

            return module;
        });

        // Return a component that wraps the lazy component with Suspense
        const WrappedComponent = (props: object) => (
            <React.Suspense fallback={loaderFn()}>
                <LazyComponent {...props} />
            </React.Suspense>
        );

        // Preserve display name for debugging
        WrappedComponent.displayName = component_name ? `LazyLoader(${component_name})` : 'LazyLoader';

        return WrappedComponent;
    };
