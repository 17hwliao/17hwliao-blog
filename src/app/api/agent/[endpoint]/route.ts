import { proxyAgent } from '@/features/assistant/proxy'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

type Context = { params: Promise<{ endpoint: string }> }
async function handle(request: Request, context: Context) {
	const { endpoint } = await context.params
	return proxyAgent(request, endpoint)
}

export const GET = handle
export const POST = handle
export const DELETE = handle
