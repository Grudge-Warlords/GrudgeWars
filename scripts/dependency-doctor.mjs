import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

const deps = packageJson.dependencies || {};
const devDeps = packageJson.devDependencies || {};
const issues = [];

if (deps.react && deps['react-dom'] && deps.react !== deps['react-dom']) {
  issues.push({ severity: 'high', type: 'react-version-skew', message: 'react and react-dom should stay aligned.' });
}

if (devDeps.vite && String(devDeps.vite).startsWith('^7')) {
  issues.push({ severity: 'high', type: 'vite-node-mismatch', message: 'Vite 7 requires newer Node than this environment currently provides.' });
}

if (deps.sprite) {
  issues.push({ severity: 'medium', type: 'legacy-package', message: 'sprite is a very old package and may conflict with modern bundlers.' });
}

if (deps['@lodev09/react-native-true-sheet']) {
  issues.push({ severity: 'medium', type: 'react-native-tree', message: 'react-native-true-sheet pulls a large React Native dependency tree into a web app.' });
}

const report = {
  generatedAt: new Date().toISOString(),
  nodeExpected: packageJson.engines?.node || 'not-pinned',
  scripts: packageJson.scripts,
  issues,
};

fs.mkdirSync(path.join(root, 'storage', 'manifests'), { recursive: true });
fs.writeFileSync(path.join(root, 'storage', 'manifests', 'dependency-health.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
