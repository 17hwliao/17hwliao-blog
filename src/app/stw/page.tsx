import Globe from '@/features/stw/globe'
import '@/styles/stw.css'

export const metadata = { title: 'STW · Stop the World · 17hwliao' }
export default function StwPage() {
	return (
		<section className='stw-page'>
			<header className='stw-heading'>
				<h1>STW</h1>
				<p>Stop the World</p>
			</header>
			<Globe enableHover />
		</section>
	)
}
