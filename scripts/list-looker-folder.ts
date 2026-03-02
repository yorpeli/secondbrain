import 'dotenv/config';
import { authenticate } from '../analytics/lib/looker-client.js';

async function main() {
  const token = await authenticate();
  const baseUrl = process.env.LOOKER_BASE_URL;
  const folderId = process.argv[2] || '2393';

  const headers = { Authorization: `Bearer ${token}` };
  const base = `https://${baseUrl}/api/4.0`;

  // Folder info
  const folderRes = await fetch(`${base}/folders/${folderId}`, { headers });
  const folder = await folderRes.json() as any;
  console.log(`\n=== FOLDER: ${folder.name} (ID: ${folderId}) ===\n`);

  // Looks
  const looksRes = await fetch(`${base}/folders/${folderId}/looks`, { headers });
  const looks = await looksRes.json() as any[];

  if (Array.isArray(looks) && looks.length > 0) {
    console.log(`LOOKS (${looks.length}):`);
    for (const look of looks) {
      console.log(`  [${look.id}] ${look.title}`);
      if (look.description) console.log(`       Desc: ${look.description}`);
      console.log(`       Model: ${look.query?.model || '?'} / View: ${look.query?.view || '?'}`);
      console.log(`       Updated: ${look.updated_at?.slice(0, 10)}`);
    }
  } else {
    console.log('LOOKS: (none)');
  }

  // Dashboards
  const dashRes = await fetch(`${base}/folders/${folderId}/dashboards`, { headers });
  const dashboards = await dashRes.json() as any[];

  if (Array.isArray(dashboards) && dashboards.length > 0) {
    console.log(`\nDASHBOARDS (${dashboards.length}):`);
    for (const d of dashboards) {
      console.log(`  [${d.id}] ${d.title}`);
      if (d.description) console.log(`       Desc: ${d.description}`);
    }
  }

  // Subfolders
  const childRes = await fetch(`${base}/folders/${folderId}/children`, { headers });
  const children = await childRes.json() as any[];

  if (Array.isArray(children) && children.length > 0) {
    console.log(`\nSUBFOLDERS (${children.length}):`);
    for (const c of children) {
      console.log(`  [${c.id}] ${c.name}`);
    }
  }
}

main().catch(e => { console.error(e.message); process.exit(1); });
