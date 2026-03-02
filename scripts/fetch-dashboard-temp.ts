/**
 * Temp: fetch dashboard 2618 (RTQ) structure.
 */
import 'dotenv/config'
import { authenticate } from '../analytics/lib/looker-client.js'

async function main() {
  const token = await authenticate()
  const baseUrl = process.env.LOOKER_BASE_URL

  const res = await fetch(
    `https://${baseUrl}/api/4.0/dashboards/2618`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const dash = await res.json() as Record<string, unknown>

  console.log('Dashboard:', dash.title)
  console.log('\nFilters:')
  const filters = dash.dashboard_filters as Array<Record<string, unknown>> ?? []
  for (const f of filters) {
    console.log(`  "${f.title}": field=${f.dimension}, default=${JSON.stringify(f.default_value)}`)
  }

  console.log('\nElements (tiles):')
  const elements = dash.dashboard_elements as Array<Record<string, unknown>> ?? []
  for (const el of elements) {
    const title = el.title ?? el.title_text ?? '(no title)'
    const q = el.query as Record<string, unknown> | undefined
    if (!q) { console.log(`  "${title}" — no query`); continue }
    console.log(`  "${title}" — model=${q.model}, view=${q.view}`)
    const fields = q.fields as string[] ?? []
    const qFilters = q.filters as Record<string, string> ?? {}
    console.log(`    fields: ${fields.join(', ')}`)
    console.log(`    filters: ${JSON.stringify(qFilters)}`)
    const dynamicFields = q.dynamic_fields as string ?? ''
    if (dynamicFields) console.log(`    dynamic_fields: ${dynamicFields.slice(0, 300)}`)
    console.log()
  }
}

main().catch(err => console.error('Error:', err.message ?? err))
