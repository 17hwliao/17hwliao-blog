export function assertBlogSlug(slug: string): void {
	if (!slug || slug !== slug.trim() || slug === '.' || slug === '..' || /[/\\?#%\u0000-\u001f\u007f]/.test(slug)) {
		throw new Error('文章路径需要是单个名称，不能包含斜杠、空白边界或 URL 控制字符。')
	}
}
