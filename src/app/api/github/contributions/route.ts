import { fetchContributions } from '@/features/github/contributions'

export async function GET() {
	try {
		return Response.json(await fetchContributions(), { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=3600' } })
	} catch {
		return Response.json({ error: '暂时无法读取 GitHub 贡献，请稍后重试。' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
	}
}
