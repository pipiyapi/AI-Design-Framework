import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { writeEntry } from '../scripts/lib/vault.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(process.argv[2] || '/tmp/design-memory-preview');
await fs.rm(root, { recursive: true, force: true });
for (const dir of [
  '00-Inbox', '01-References', '02-Patterns', '03-Recipes', '04-Principles',
  '05-Personal-DNA', '06-Projects/Feedback-Inbox/demo-project', '06-Projects/Accepted',
  '_assets/references/ref-atelier', '_assets/preview', '_archive/rejected-references',
  '_archive/rejected-patterns', '_candidates/patterns', '_system',
]) await fs.mkdir(path.join(root, dir), { recursive: true });
await fs.copyFile(path.join(repoRoot, '_system/settings.json'), path.join(root, '_system/settings.json'));
await fs.copyFile(path.join(repoRoot, '_system/taxonomy.json'), path.join(root, '_system/taxonomy.json'));

const desktop = `<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="980" viewBox="0 0 1440 980"><rect width="1440" height="980" fill="#eee8dc"/><rect x="48" y="42" width="1344" height="60" fill="none" stroke="#22201d"/><text x="72" y="80" font-family="Arial" font-size="20" fill="#22201d">ATELIER / INDEX</text><text x="1170" y="80" font-family="Arial" font-size="15" fill="#22201d">WORK  ABOUT  CONTACT</text><rect x="48" y="132" width="558" height="800" fill="#211f1b"/><circle cx="327" cy="410" r="164" fill="#b9422c"/><path d="M176 590 C260 470 390 480 492 650" fill="none" stroke="#eee8dc" stroke-width="18"/><text x="662" y="298" font-family="Georgia" font-size="92" fill="#211f1b">Objects with</text><text x="662" y="390" font-family="Georgia" font-size="92" fill="#211f1b">a memory.</text><line x1="662" y1="438" x2="1348" y2="438" stroke="#211f1b"/><text x="662" y="494" font-family="Arial" font-size="21" fill="#211f1b">A quiet archive of material studies, edition 04.</text><text x="662" y="760" font-family="Arial" font-size="16" fill="#211f1b">01  FORM</text><text x="662" y="814" font-family="Arial" font-size="16" fill="#211f1b">02  SURFACE</text><text x="662" y="868" font-family="Arial" font-size="16" fill="#211f1b">03  AFTERIMAGE</text></svg>`;
const mobile = `<svg xmlns="http://www.w3.org/2000/svg" width="390" height="844" viewBox="0 0 390 844"><rect width="390" height="844" fill="#eee8dc"/><text x="22" y="38" font-family="Arial" font-size="14" fill="#22201d">ATELIER / INDEX</text><rect x="18" y="64" width="354" height="370" fill="#211f1b"/><circle cx="195" cy="235" r="104" fill="#b9422c"/><text x="18" y="520" font-family="Georgia" font-size="46" fill="#211f1b">Objects with</text><text x="18" y="570" font-family="Georgia" font-size="46" fill="#211f1b">a memory.</text><line x1="18" y1="606" x2="372" y2="606" stroke="#211f1b"/><text x="18" y="648" font-family="Arial" font-size="15" fill="#211f1b">A quiet archive of material studies.</text></svg>`;
const before = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="900" height="560" fill="#f2f0ea"/><rect x="40" y="40" width="820" height="480" rx="32" fill="#fff" stroke="#ddd"/><text x="80" y="130" font-family="Arial" font-size="42">Knowledge answer</text><g fill="#794cff"><rect x="80" y="200" width="180" height="52" rx="26"/><rect x="280" y="200" width="180" height="52" rx="26"/><rect x="480" y="200" width="180" height="52" rx="26"/></g></svg>`;
const after = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560"><rect width="900" height="560" fill="#eeeae1"/><text x="46" y="92" font-family="Georgia" font-size="52" fill="#1e1d1a">Knowledge answer</text><line x1="46" y1="126" x2="854" y2="126" stroke="#9f9a8d"/><text x="46" y="194" font-family="Arial" font-size="19" fill="#1e1d1a">A restrained reading surface with sources in a second column.</text><text x="46" y="310" font-family="Arial" font-size="16" fill="#1e1d1a">01  Policy handbook</text><text x="520" y="310" font-family="Arial" font-size="16" fill="#1e1d1a">Page 12</text></svg>`;
await fs.writeFile(path.join(root, '_assets/references/ref-atelier/desktop.svg'), desktop);
await fs.writeFile(path.join(root, '_assets/references/ref-atelier/mobile.svg'), mobile);
await fs.writeFile(path.join(root, '_assets/preview/before.svg'), before);
await fs.writeFile(path.join(root, '_assets/preview/after.svg'), after);

await writeEntry(path.join(root, '00-Inbox/ref-atelier.md'), {
  id: 'ref-atelier', type: 'reference', title: 'Atelier Index', status: 'inbox', review_status: 'pending',
  source_type: 'url', source_url: 'https://example.com/atelier',
  cover_asset: '_assets/references/ref-atelier/desktop.svg',
  media_assets: ['_assets/references/ref-atelier/desktop.svg', '_assets/references/ref-atelier/mobile.svg'],
  suggested_tags: ['editorial', 'asymmetric', 'warm-neutral', 'portfolio'], tags: [], liked_aspects: [],
  created_at: new Date().toISOString(),
}, `\n# Atelier Index\n\n## AI analysis\n\nThe page uses a dense dark visual anchor against a generous editorial reading field. Serif display type and a single vermilion accent create a material, archival tone.\n`);

await writeEntry(path.join(root, '_candidates/patterns/pattern-editorial-anchor.md'), {
  id: 'pattern-editorial-anchor', type: 'pattern', title: 'Editorial Visual Anchor', status: 'candidate',
  source_references: ['ref-atelier', 'ref-object-index', 'ref-archive-study'],
  media_assets: ['_assets/references/ref-atelier/desktop.svg'], tags: ['editorial', 'asymmetric'],
  works_for: ['portfolio', 'brand-led'], avoid_for: ['dense-dashboard'], created_at: new Date().toISOString(),
}, `\n# Editorial Visual Anchor\n\n## Shared design rule\n\nPlace one optically heavy visual block against a much quieter reading field. The imbalance establishes identity without filling the page with decoration.\n`);

await writeEntry(path.join(root, '06-Projects/Feedback-Inbox/demo-project/feedback.md'), {
  id: 'feedback-knowledge-project', type: 'feedback', title: 'Knowledge project — radius and motion',
  status: 'pending-review', project_name: 'Enterprise Knowledge Base', project_type: 'knowledge-base',
  skill_version: '0.1.0', classification: 'unclassified',
  explicit_feedback: 'The first version felt too playful. The quieter article layout is right for this project.',
  before_asset: '_assets/preview/before.svg', after_asset: '_assets/preview/after.svg', created_at: new Date().toISOString(),
}, `\n# Knowledge project feedback\n\n## Explicit user feedback\n\nThe first version felt too playful. The quieter article layout is right for this project.\n`);

console.log(root);
