/**
 * Stand-in for `@deriv-com/ui`'s AppLayout `Submenu` module.
 *
 * The published package contains a directory literally named `Submenu ` — with a
 * trailing space — and three of its modules import from it. Windows path
 * normalisation strips trailing spaces, so npm never writes that directory and
 * the bundler cannot resolve the request; the build fails on Windows before any
 * app code runs. (Creating the directory through a `\\?\` device path does not
 * help: the resolver normalises the request the same way.)
 *
 * `rsbuild.config.ts` aliases the three request strings here. This app renders
 * its own submenu components (`src/components/layout/header/mobile-menu/`) and
 * never imports `Submenu` from `@deriv-com/ui`, so nothing reaches this code —
 * it exists purely to satisfy the barrel re-export.
 *
 * Remove the alias and this file if `@deriv-com/ui` ever ships the directory
 * with a name Windows can represent.
 */
import type { ReactNode } from 'react';

type TSubmenuProps = {
    children?: ReactNode;
} & Record<string, unknown>;

export const Submenu = ({ children, ...rest }: TSubmenuProps) => <div {...rest}>{children}</div>;

export default Submenu;
