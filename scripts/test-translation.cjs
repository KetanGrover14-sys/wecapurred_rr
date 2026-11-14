const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { pathToFileURL } = require('node:url');
const { transformSync } = require('next/dist/build/swc');

const chrome = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
assert.ok(fs.existsSync(chrome), 'Set CHROME_PATH to a Chrome executable');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'translation-test-'));
const component = transformSync(fs.readFileSync('components/TranslatedText.js', 'utf8'), {
  filename: 'TranslatedText.js',
  jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'classic' } } },
  module: { type: 'commonjs' },
}).code;
const scriptUrl = (file) => pathToFileURL(path.resolve(file)).href;
const html = `<!doctype html><html><body><div id="root"></div><pre id="result">RUNNING</pre>
<script src="${scriptUrl('node_modules/react/umd/react.development.js')}"></script>
<script src="${scriptUrl('node_modules/react-dom/umd/react-dom.development.js')}"></script>
<script>const exports = {}; ${component}
const Text = exports.default;
const h = React.createElement;
const root = ReactDOM.createRoot(document.getElementById('root'));
const check = (condition, message) => { if (!condition) throw new Error(message); };
// Chrome Translate substitutes nested font elements for the original text nodes.
function translate(label) {
  const walker = document.createTreeWalker(document.getElementById('root'), NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  for (const node of nodes) {
    const outer = document.createElement('font');
    const inner = document.createElement('font');
    inner.textContent = label;
    outer.appendChild(inner);
    node.parentNode.replaceChild(outer, node);
  }
}
function render(loading, label) {
  ReactDOM.flushSync(() => root.render(h('button', null,
    loading && h('svg', { 'data-loader': true }), h(Text, null, label))));
  check(document.querySelector('button').textContent === label, 'Stale label: ' + label);
  check(!!document.querySelector('svg') === loading, 'Incorrect loader state');
  check(!document.querySelector('font'), 'Stale translated text survived update');
}
try {
  for (const language of ['साइन इन', 'உள்நுழை']) {
    render(false, 'Sign In');
    translate(language);
    render(true, 'Signing in…');
    translate(language);
    render(false, 'Sign In');
    translate(language);
    render(false, 'Save Photo');
    translate(language);
    render(true, 'Uploading…');
    translate(language);
    render(true, '0%');
    translate(language);
    render(true, '37%');
    translate(language);
    render(true, '100%');
    translate(language);
    render(false, 'Save 2 Photos');
    translate(language);
    render(false, '1 entry · one photo each');
    translate(language);
    render(false, '2 entries · one photo each');
    translate(language);
    render(false, 'Entry 2');
    translate(language);
    render(false, 'Entry 1');
    translate(language);
    ReactDOM.flushSync(() => root.render(null));
    check(!document.querySelector('#root').childNodes.length, 'Unmount failed');
  }
  document.getElementById('result').textContent = 'PASS: translated login, upload, progress, retry and unmount (Hindi and Tamil)';
} catch (error) {
  document.getElementById('result').textContent = 'FAIL: ' + error.stack;
}
</script></body></html>`;
const file = path.join(temp, 'test.html');
fs.writeFileSync(file, html);
const result = spawnSync(chrome, ['--headless', '--disable-gpu', '--no-first-run',
  '--user-data-dir=' + path.join(temp, 'profile'), '--dump-dom', pathToFileURL(file).href],
  { encoding: 'utf8', timeout: 60000, windowsHide: true, maxBuffer: 4 * 1024 * 1024 });
if (result.error) throw result.error;
const match = result.stdout.match(/<pre id="result">([\s\S]*?)<\/pre>/);
assert.ok(match, 'Chrome did not return a test result: ' + result.stderr);
assert.ok(match[1].startsWith('PASS:'), match[1]);
console.log(match[1]);
