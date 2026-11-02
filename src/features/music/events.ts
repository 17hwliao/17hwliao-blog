export const musicRequestEvent = 'blog:music-request'
// The existing header owns the only audio element. This function is called
// exclusively from explicit click/keyboard actions, never on navigation.
export function requestMusic(trackId: string) {
	window.dispatchEvent(new CustomEvent(musicRequestEvent, { detail: trackId }))
}
