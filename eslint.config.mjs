import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

// eslint-config-next 16 ships a flat-config array at this subpath, so it is used directly with no
// FlatCompat shim (the same config as pos-ui). `next lint` no longer exists in Next 16.
// The React version is set explicitly: eslint-plugin-react's automatic detection calls a context
// API that ESLint 10 removed and crashes.
const eslintConfig = [
  ...nextCoreWebVitals,
  { settings: { react: { version: "19.2" } } },
  { ignores: [".next/**", "node_modules/**", "public/sw.js"] },
];

export default eslintConfig;
