/**
 * Temp: run the RTQ dashboard tile query by its slug.
 * Tile slug from dashboard 2618 fetch: first tile query
 */
import 'dotenv/config'
import { authenticate, runQuery } from '../analytics/lib/looker-client.js'

async function main() {
  const token = await authenticate()
  const baseUrl = process.env.LOOKER_BASE_URL

  // Get the tile query slug from the dashboard
  const dashRes = await fetch(`https://${baseUrl}/api/4.0/dashboards/2618`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const dash = await dashRes.json() as Record<string, unknown>
  const elements = dash.dashboard_elements as Array<Record<string, unknown>> ?? []
  const mainTile = elements.find(e => (e.title as string)?.includes('Requirement Results'))
  const tileQuery = mainTile?.query as Record<string, unknown>

  if (!tileQuery?.id) {
    console.error('Could not find main tile query')
    return
  }

  console.log(`Main tile query ID: ${tileQuery.id}`)
  console.log('Running...')

  // Run with filter override for date
  // Use create_query with the tile's parameters but override date
  const queryBody = {
    model: tileQuery.model,
    view: tileQuery.view,
    fields: tileQuery.fields,
    filters: {
      ...(tileQuery.filters as Record<string, string>),
      'experiments.experiment_joined_date': 'after 2026/02/24',
    },
    dynamic_fields: tileQuery.dynamic_fields,
    sorts: tileQuery.sorts,
    limit: '10',
  }

  const createRes = await fetch(`https://${baseUrl}/api/4.0/queries`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(queryBody),
  })
  if (!createRes.ok) {
    console.error(`Create failed: ${createRes.status} ${(await createRes.text()).slice(0, 500)}`)
    return
  }
  const query = await createRes.json() as { id: number }
  console.log(`Query ID: ${query.id}`)

  const runRes = await fetch(`https://${baseUrl}/api/4.0/queries/${query.id}/run/json`, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(180_000),
  })
  if (!runRes.ok) {
    console.error(`Run failed: ${runRes.status} ${(await runRes.text()).slice(0, 300)}`)
    return
  }
  const rows = await runRes.json() as Record<string, unknown>[]

  console.log(`\nRows: ${rows.length}\n`)
  for (const r of rows) {
    const group = r['experiments.experiment_group']
    console.log(`\n=== ${group} ===`)
    for (const [k, v] of Object.entries(r)) {
      if (k === 'experiments.experiment_group') continue
      const shortKey = k.split('.').pop() ?? k
      if (typeof v === 'number') {
        console.log(`  ${shortKey.padEnd(50)} ${v}`)
      } else {
        console.log(`  ${shortKey.padEnd(50)} ${v}`)
      }
    }
  }
}

main().catch(err => console.error('Error:', err.message ?? err))
