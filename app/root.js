import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, } from "@remix-run/react";
import styles from "./styles/tailwind.css?url";
export const links = () => [
    { rel: "stylesheet", href: styles },
];
export default function App() {
    return (_jsxs("html", { lang: "en", children: [_jsxs("head", { children: [_jsx(Meta, {}), _jsx(Links, {})] }), _jsxs("body", { children: [_jsx(Outlet, {}), _jsx(ScrollRestoration, {}), _jsx(Scripts, {}), _jsx(LiveReload, {})] })] }));
}
