import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createBridge } from './server.js'

const token = process.env.OUTLOOK_BRIDGE_TOKEN
if (!token) {
  console.error('OUTLOOK_BRIDGE_TOKEN is not set (add it to .env). Refusing to start.')
  process.exit(1)
}

const port = Number(process.env.OUTLOOK_BRIDGE_PORT ?? 7777)
const here = path.dirname(fileURLToPath(import.meta.url))
const scriptPath = path.join(here, 'draft.applescript')
const allowedOrigin = process.env.OUTLOOK_BRIDGE_ORIGIN ?? 'http://localhost:5173'

const server = createBridge({ token, scriptPath, allowedOrigin })
server.listen(port, '127.0.0.1', () => {
  console.log(`outlook-bridge listening on http://127.0.0.1:${port} (origin ${allowedOrigin})`)
})
