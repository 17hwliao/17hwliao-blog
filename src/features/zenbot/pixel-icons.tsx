'use client'

import { useState, type SVGProps } from 'react'
import { HEARTBEAT, play } from '@/lib/sound'

export function PixelArrowUpRightIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 38 38' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M18 0h11v1h-11zM10 1h23v1h-23zM8 2h26v1h-26zM7 3h28v1h-28zM7 4h12v1h-12zM28 4h7v1h-7zM8 5h3v1h-3zM29 5h6v1h-6zM28 6h7v1h-7zM27 7h8v1h-8zM26 8h9v1h-9zM25 9h5v1h-5zM31 9h4v1h-4zM24 10h5v1h-5zM31 10h4v1h-4zM23 11h5v1h-5zM31 11h4v1h-4zM22 12h5v1h-5zM31 12h4v1h-4zM21 13h5v1h-5zM31 13h4v1h-4zM20 14h5v1h-5zM31 14h4v1h-4zM19 15h5v1h-5zM31 15h4v1h-4zM18 16h5v1h-5zM31 16h4v1h-4zM17 17h5v1h-5zM31 17h4v1h-4zM16 18h5v1h-5zM31 18h4v1h-4zM15 19h5v1h-5zM31 19h4v1h-4zM14 20h5v1h-5zM31 20h5v1h-5zM14 21h4v1h-4zM32 21h4v1h-4zM13 22h5v1h-5zM32 22h4v1h-4zM12 23h5v1h-5zM32 23h4v1h-4zM11 24h5v1h-5zM32 24h4v1h-4zM10 25h5v1h-5zM32 25h4v1h-4zM9 26h5v1h-5zM32 26h4v1h-4zM8 27h5v1h-5zM32 27h4v1h-4zM7 28h5v1h-5zM32 28h4v1h-4zM7 29h4v1h-4zM32 29h4v1h-4zM6 30h5v1h-5zM32 30h4v1h-4zM5 31h5v1h-5zM33 31h2v1h-2zM4 32h5v1h-5zM3 33h5v1h-5zM2 34h5v1h-5zM1 35h5v1h-5zM1 36h4v1h-4zM2 37h2v1h-2z' />
		</svg>
	)
}

export function PixelRotateIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 50 17' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M36 0h5v1h-5zM43 0h6v1h-6zM35 1h15v1h-15zM35 2h15v1h-15zM35 3h15v1h-15zM1 4h11v1h-11zM36 4h13v1h-13zM0 5h13v1h-13zM38 5h11v1h-11zM0 6h13v1h-13zM38 6h11v1h-11zM0 7h13v1h-13zM37 7h12v1h-12zM0 8h12v1h-12zM35 8h14v1h-14zM1 9h11v1h-11zM33 9h16v1h-16zM1 10h15v1h-15zM30 10h12v1h-12zM44 10h5v1h-5zM1 11h40v1h-40zM44 11h5v1h-5zM2 12h38v1h-38zM45 12h3v1h-3zM2 13h36v1h-36zM2 14h6v1h-6zM9 14h27v1h-27zM2 15h6v1h-6zM14 15h18v1h-18zM3 16h4v1h-4z' />
		</svg>
	)
}

export function PixelBrushIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 41 41' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M27 0h6v1h-6zM25 1h10v1h-10zM24 2h11v1h-11zM23 3h12v1h-12zM23 4h12v1h-12zM23 5h12v1h-12zM21 6h14v1h-14zM20 7h15v1h-15zM19 8h16v1h-16zM19 9h16v1h-16zM18 10h17v1h-17zM17 11h17v1h-17zM17 12h17v1h-17zM17 13h16v1h-16zM17 14h16v1h-16zM17 15h15v1h-15zM16 16h15v1h-15zM16 17h14v1h-14zM15 18h14v1h-14zM15 19h14v1h-14zM14 20h15v1h-15zM13 21h15v1h-15zM13 22h14v1h-14zM13 23h14v1h-14zM13 24h13v1h-13zM14 25h11v1h-11zM14 26h9v1h-9zM11 27h6v1h-6zM18 27h5v1h-5zM10 28h8v1h-8zM19 28h3v1h-3zM9 29h10v1h-10zM8 30h7v1h-7zM16 30h4v1h-4zM7 31h4v1h-4zM17 31h3v1h-3zM7 32h4v1h-4zM17 32h3v1h-3zM7 33h4v1h-4zM16 33h4v1h-4zM7 34h4v1h-4zM15 34h4v1h-4zM7 35h4v1h-4zM15 35h3v1h-3zM5 36h5v1h-5zM13 36h4v1h-4zM5 37h4v1h-4zM11 37h6v1h-6zM5 38h11v1h-11zM5 39h10v1h-10zM5 40h9v1h-9z' />
		</svg>
	)
}

export function PixelSoundOnIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 41 41' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M31 3h3v1h-3zM30 4h5v1h-5zM19 5h2v1h-2zM30 5h6v1h-6zM16 6h6v1h-6zM31 6h6v1h-6zM1 7h3v1h-3zM14 7h9v1h-9zM33 7h4v1h-4zM0 8h7v1h-7zM11 8h12v1h-12zM33 8h5v1h-5zM0 9h23v1h-23zM34 9h4v1h-4zM0 10h24v1h-24zM27 10h2v1h-2zM34 10h5v1h-5zM0 11h24v1h-24zM26 11h4v1h-4zM35 11h4v1h-4zM0 12h24v1h-24zM26 12h4v1h-4zM35 12h5v1h-5zM0 13h24v1h-24zM26 13h5v1h-5zM36 13h4v1h-4zM0 14h23v1h-23zM27 14h4v1h-4zM36 14h4v1h-4zM0 15h23v1h-23zM27 15h4v1h-4zM36 15h4v1h-4zM1 16h22v1h-22zM27 16h4v1h-4zM36 16h5v1h-5zM1 17h22v1h-22zM27 17h4v1h-4zM37 17h4v1h-4zM1 18h22v1h-22zM27 18h4v1h-4zM37 18h4v1h-4zM1 19h22v1h-22zM27 19h4v1h-4zM37 19h4v1h-4zM1 20h22v1h-22zM27 20h4v1h-4zM37 20h4v1h-4zM1 21h22v1h-22zM27 21h4v1h-4zM37 21h4v1h-4zM1 22h22v1h-22zM27 22h4v1h-4zM37 22h4v1h-4zM1 23h22v1h-22zM27 23h4v1h-4zM37 23h4v1h-4zM1 24h22v1h-22zM27 24h4v1h-4zM37 24h4v1h-4zM1 25h22v1h-22zM27 25h4v1h-4zM37 25h4v1h-4zM1 26h22v1h-22zM27 26h4v1h-4zM37 26h4v1h-4zM1 27h22v1h-22zM28 27h2v1h-2zM37 27h4v1h-4zM1 28h22v1h-22zM37 28h4v1h-4zM2 29h21v1h-21zM37 29h4v1h-4zM3 30h20v1h-20zM36 30h5v1h-5zM9 31h14v1h-14zM36 31h4v1h-4zM12 32h11v1h-11zM35 32h5v1h-5zM13 33h10v1h-10zM35 33h4v1h-4zM14 34h9v1h-9zM35 34h4v1h-4zM15 35h8v1h-8zM36 35h2v1h-2zM17 36h5v1h-5zM19 37h2v1h-2z' />
		</svg>
	)
}

export function PixelSoundOffIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 44 41' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M19 5h2v1h-2zM16 6h6v1h-6zM1 7h3v1h-3zM14 7h9v1h-9zM0 8h7v1h-7zM11 8h12v1h-12zM0 9h23v1h-23zM0 10h24v1h-24zM0 11h24v1h-24zM0 12h24v1h-24zM28 12h3v1h-3zM40 12h3v1h-3zM0 13h24v1h-24zM28 13h5v1h-5zM39 13h5v1h-5zM0 14h23v1h-23zM29 14h5v1h-5zM39 14h5v1h-5zM0 15h23v1h-23zM30 15h5v1h-5zM38 15h5v1h-5zM1 16h22v1h-22zM31 16h5v1h-5zM37 16h5v1h-5zM1 17h22v1h-22zM32 17h9v1h-9zM1 18h22v1h-22zM33 18h7v1h-7zM1 19h22v1h-22zM34 19h5v1h-5zM1 20h22v1h-22zM33 20h7v1h-7zM1 21h22v1h-22zM32 21h9v1h-9zM1 22h22v1h-22zM30 22h6v1h-6zM37 22h5v1h-5zM1 23h22v1h-22zM29 23h6v1h-6zM38 23h5v1h-5zM1 24h22v1h-22zM28 24h6v1h-6zM39 24h5v1h-5zM1 25h22v1h-22zM28 25h5v1h-5zM40 25h4v1h-4zM1 26h22v1h-22zM29 26h2v1h-2zM41 26h2v1h-2zM1 27h22v1h-22zM1 28h22v1h-22zM2 29h21v1h-21zM3 30h20v1h-20zM9 31h14v1h-14zM12 32h11v1h-11zM13 33h10v1h-10zM14 34h9v1h-9zM15 35h8v1h-8zM17 36h5v1h-5zM19 37h2v1h-2z' />
		</svg>
	)
}

export function PixelWalkerIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 47 47' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M17 0h6v1h-6zM16 1h9v1h-9zM15 2h11v1h-11zM14 3h13v1h-13zM13 4h5v1h-5zM22 4h6v1h-6zM12 5h5v1h-5zM24 5h5v1h-5zM12 6h4v1h-4zM25 6h5v1h-5zM12 7h4v1h-4zM26 7h4v1h-4zM12 8h5v1h-5zM26 8h4v1h-4zM13 9h5v1h-5zM26 9h4v1h-4zM14 10h5v1h-5zM26 10h4v1h-4zM15 11h4v1h-4zM26 11h4v1h-4zM15 12h4v1h-4zM26 12h4v1h-4zM15 13h15v1h-15zM16 14h13v1h-13zM17 15h11v1h-11zM18 16h9v1h-9zM19 17h5v1h-5zM19 18h4v1h-4zM19 19h4v1h-4zM34 19h2v1h-2zM19 20h4v1h-4zM33 20h4v1h-4zM18 21h6v1h-6zM32 21h5v1h-5zM17 22h8v1h-8zM31 22h5v1h-5zM16 23h10v1h-10zM30 23h5v1h-5zM15 24h12v1h-12zM29 24h5v1h-5zM14 25h5v1h-5zM20 25h13v1h-13zM13 26h5v1h-5zM20 26h12v1h-12zM12 27h5v1h-5zM20 27h4v1h-4zM25 27h6v1h-6zM11 28h6v1h-6zM20 28h4v1h-4zM26 28h4v1h-4zM10 29h6v1h-6zM20 29h4v1h-4zM27 29h2v1h-2zM10 30h4v1h-4zM20 30h4v1h-4zM11 31h2v1h-2zM20 31h4v1h-4zM20 32h5v1h-5zM20 33h5v1h-5zM20 34h5v1h-5zM19 35h7v1h-7zM19 36h8v1h-8zM18 37h9v1h-9zM18 38h4v1h-4zM23 38h5v1h-5zM18 39h4v1h-4zM24 39h5v1h-5zM17 40h5v1h-5zM25 40h4v1h-4zM16 41h5v1h-5zM25 41h5v1h-5zM16 42h5v1h-5zM26 42h5v1h-5zM15 43h5v1h-5zM27 43h5v1h-5zM15 44h5v1h-5zM28 44h4v1h-4zM15 45h4v1h-4zM28 45h4v1h-4zM16 46h2v1h-2zM29 46h2v1h-2z' />
		</svg>
	)
}

export function PixelWalkerOffIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M18 0h6v1h-6zM17 1h9v1h-9zM16 2h11v1h-11zM15 3h13v1h-13zM14 4h5v1h-5zM23 4h6v1h-6zM5 5h4v1h-4zM13 5h5v1h-5zM25 5h5v1h-5zM4 6h6v1h-6zM13 6h4v1h-4zM26 6h5v1h-5zM4 7h6v1h-6zM13 7h4v1h-4zM27 7h4v1h-4zM5 8h5v1h-5zM13 8h5v1h-5zM27 8h4v1h-4zM6 9h5v1h-5zM14 9h5v1h-5zM27 9h4v1h-4zM7 10h6v1h-6zM15 10h5v1h-5zM27 10h4v1h-4zM8 11h6v1h-6zM16 11h4v1h-4zM27 11h4v1h-4zM9 12h6v1h-6zM16 12h4v1h-4zM27 12h4v1h-4zM10 13h21v1h-21zM11 14h19v1h-19zM12 15h17v1h-17zM13 16h5v1h-5zM19 16h9v1h-9zM14 17h5v1h-5zM20 17h5v1h-5zM15 18h9v1h-9zM15 19h9v1h-9zM35 19h2v1h-2zM16 20h8v1h-8zM34 20h4v1h-4zM17 21h8v1h-8zM33 21h5v1h-5zM18 22h8v1h-8zM32 22h5v1h-5zM17 23h10v1h-10zM31 23h5v1h-5zM16 24h12v1h-12zM30 24h5v1h-5zM15 25h19v1h-19zM14 26h5v1h-5zM21 26h12v1h-12zM13 27h5v1h-5zM21 27h11v1h-11zM12 28h6v1h-6zM21 28h10v1h-10zM11 29h6v1h-6zM21 29h9v1h-9zM11 30h4v1h-4zM21 30h9v1h-9zM12 31h2v1h-2zM21 31h4v1h-4zM26 31h5v1h-5zM21 32h5v1h-5zM27 32h4v1h-4zM21 33h5v1h-5zM27 33h6v1h-6zM21 34h5v1h-5zM28 34h6v1h-6zM20 35h7v1h-7zM29 35h6v1h-6zM20 36h8v1h-8zM30 36h5v1h-5zM19 37h9v1h-9zM31 37h5v1h-5zM19 38h4v1h-4zM24 38h5v1h-5zM32 38h5v1h-5zM19 39h4v1h-4zM25 39h5v1h-5zM33 39h5v1h-5zM18 40h5v1h-5zM26 40h4v1h-4zM34 40h5v1h-5zM17 41h5v1h-5zM26 41h5v1h-5zM35 41h5v1h-5zM17 42h5v1h-5zM27 42h5v1h-5zM36 42h5v1h-5zM16 43h5v1h-5zM28 43h5v1h-5zM37 43h6v1h-6zM16 44h5v1h-5zM29 44h4v1h-4zM38 44h6v1h-6zM16 45h4v1h-4zM29 45h4v1h-4zM39 45h5v1h-5zM17 46h2v1h-2zM30 46h2v1h-2zM40 46h4v1h-4zM41 47h2v1h-2z' />
		</svg>
	)
}

export function PixelGithubIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 43 43' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M21 0h9v1h-9zM18 1h14v1h-14zM15 2h19v1h-19zM12 3h23v1h-23zM10 4h26v1h-26zM8 5h29v1h-29zM7 6h31v1h-31zM6 7h33v1h-33zM6 8h33v1h-33zM5 9h35v1h-35zM4 10h36v1h-36zM3 11h37v1h-37zM3 12h12v1h-12zM19 12h13v1h-13zM35 12h6v1h-6zM2 13h13v1h-13zM20 13h10v1h-10zM35 13h6v1h-6zM2 14h13v1h-13zM20 14h2v1h-2zM27 14h2v1h-2zM35 14h6v1h-6zM1 15h14v1h-14zM35 15h7v1h-7zM1 16h15v1h-15zM34 16h8v1h-8zM1 17h15v1h-15zM34 17h8v1h-8zM1 18h15v1h-15zM33 18h10v1h-10zM0 19h17v1h-17zM33 19h10v1h-10zM0 20h17v1h-17zM32 20h11v1h-11zM0 21h17v1h-17zM32 21h11v1h-11zM0 22h17v1h-17zM32 22h11v1h-11zM0 23h17v1h-17zM32 23h11v1h-11zM1 24h17v1h-17zM31 24h12v1h-12zM1 25h8v1h-8zM12 25h7v1h-7zM30 25h13v1h-13zM1 26h8v1h-8zM13 26h7v1h-7zM29 26h14v1h-14zM1 27h8v1h-8zM15 27h5v1h-5zM28 27h15v1h-15zM1 28h9v1h-9zM16 28h4v1h-4zM28 28h15v1h-15zM2 29h9v1h-9zM28 29h15v1h-15zM2 30h10v1h-10zM29 30h14v1h-14zM3 31h10v1h-10zM30 31h13v1h-13zM3 32h12v1h-12zM30 32h12v1h-12zM4 33h15v1h-15zM31 33h11v1h-11zM5 34h14v1h-14zM31 34h11v1h-11zM6 35h12v1h-12zM31 35h10v1h-10zM7 36h11v1h-11zM31 36h9v1h-9zM8 37h10v1h-10zM31 37h8v1h-8zM9 38h9v1h-9zM31 38h7v1h-7zM11 39h7v1h-7zM31 39h6v1h-6zM13 40h6v1h-6zM31 40h5v1h-5zM32 41h1v1h-1z' />
		</svg>
	)
}

export function PixelLaughIcon(props: SVGProps<SVGSVGElement>) {
	return (
		<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 49 49' fill='currentColor' shapeRendering='crispEdges' {...props}>
			<path d='M24 2h8v1h-8zM20 3h14v1h-14zM18 4h18v1h-18zM15 5h22v1h-22zM14 6h11v1h-11zM31 6h7v1h-7zM13 7h10v1h-10zM33 7h6v1h-6zM12 8h7v1h-7zM20 8h2v1h-2zM35 8h5v1h-5zM10 9h7v1h-7zM36 9h5v1h-5zM9 10h6v1h-6zM37 10h5v1h-5zM8 11h7v1h-7zM31 11h3v1h-3zM38 11h5v1h-5zM7 12h7v1h-7zM16 12h3v1h-3zM30 12h5v1h-5zM39 12h5v1h-5zM6 13h5v1h-5zM15 13h6v1h-6zM29 13h8v1h-8zM40 13h5v1h-5zM5 14h5v1h-5zM14 14h9v1h-9zM28 14h10v1h-10zM41 14h4v1h-4zM4 15h5v1h-5zM13 15h11v1h-11zM28 15h4v1h-4zM33 15h6v1h-6zM41 15h5v1h-5zM3 16h5v1h-5zM12 16h5v1h-5zM18 16h7v1h-7zM27 16h5v1h-5zM34 16h5v1h-5zM42 16h4v1h-4zM3 17h4v1h-4zM11 17h5v1h-5zM20 17h5v1h-5zM27 17h4v1h-4zM36 17h2v1h-2zM42 17h5v1h-5zM2 18h5v1h-5zM10 18h5v1h-5zM21 18h4v1h-4zM27 18h4v1h-4zM43 18h4v1h-4zM2 19h4v1h-4zM9 19h5v1h-5zM22 19h2v1h-2zM28 19h2v1h-2zM43 19h5v1h-5zM1 20h5v1h-5zM9 20h4v1h-4zM44 20h4v1h-4zM1 21h4v1h-4zM10 21h2v1h-2zM34 21h3v1h-3zM44 21h4v1h-4zM1 22h4v1h-4zM30 22h8v1h-8zM44 22h4v1h-4zM0 23h5v1h-5zM16 23h23v1h-23zM44 23h5v1h-5zM0 24h4v1h-4zM11 24h29v1h-29zM45 24h4v1h-4zM0 25h4v1h-4zM10 25h25v1h-25zM36 25h4v1h-4zM45 25h4v1h-4zM0 26h4v1h-4zM9 26h22v1h-22zM36 26h4v1h-4zM45 26h4v1h-4zM0 27h4v1h-4zM9 27h8v1h-8zM36 27h4v1h-4zM45 27h4v1h-4zM0 28h4v1h-4zM8 28h4v1h-4zM35 28h5v1h-5zM44 28h5v1h-5zM0 29h4v1h-4zM8 29h4v1h-4zM35 29h4v1h-4zM44 29h4v1h-4zM0 30h5v1h-5zM8 30h5v1h-5zM34 30h5v1h-5zM44 30h4v1h-4zM1 31h4v1h-4zM9 31h5v1h-5zM34 31h4v1h-4zM43 31h5v1h-5zM1 32h5v1h-5zM10 32h5v1h-5zM33 32h5v1h-5zM43 32h4v1h-4zM2 33h4v1h-4zM11 33h6v1h-6zM32 33h5v1h-5zM42 33h5v1h-5zM2 34h5v1h-5zM12 34h9v1h-9zM30 34h6v1h-6zM41 34h5v1h-5zM3 35h4v1h-4zM13 35h22v1h-22zM40 35h5v1h-5zM3 36h5v1h-5zM14 36h20v1h-20zM38 36h6v1h-6zM4 37h5v1h-5zM16 37h17v1h-17zM37 37h6v1h-6zM5 38h5v1h-5zM20 38h11v1h-11zM35 38h7v1h-7zM6 39h8v1h-8zM33 39h8v1h-8zM7 40h10v1h-10zM30 40h9v1h-9zM8 41h14v1h-14zM26 41h12v1h-12zM9 42h27v1h-27zM13 43h21v1h-21zM16 44h15v1h-15zM21 45h6v1h-6z' />
		</svg>
	)
}

const GLYPHS: boolean[][][] = [
	[[true]],
	[[true, true]],
	[[true], [true, true]],
	[
		[true, true],
		[true, true]
	],
	[
		[true, false, true],
		[false, true, false],
		[true, false, true]
	]
]

export function StyleGlyph({ index }: { index: number }) {
	const rows = GLYPHS[index] ?? GLYPHS[0]
	const gap = rows.length > 2 ? '2px' : '3px'
	return (
		<span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap }}>
			{rows.map((row, rIdx) => (
				<span key={rIdx} style={{ display: 'inline-flex', gap }}>
					{row.map((filled, cIdx) => (
						<span
							key={cIdx}
							style={{
								width: 4,
								height: 4,
								borderRadius: 999,
								background: filled ? 'currentColor' : 'transparent'
							}}
						/>
					))}
				</span>
			))}
		</span>
	)
}

export function PixelHeartButton({ size = 21 }: { size?: number }) {
	const [beating, setBeating] = useState(false)
	const height = Math.round(size * (6 / 7))

	const trigger = () => {
		setBeating(false)
		requestAnimationFrame(() => setBeating(true))
		play(HEARTBEAT)
	}

	return (
		<button type='button' className='pixel-heart-btn' aria-label='点亮红心' title='点一下听心跳声' onClick={trigger}>
			<svg
				xmlns='http://www.w3.org/2000/svg'
				width={size}
				height={height}
				viewBox='0 0 7 6'
				className={'pixel-heart-svg' + (beating ? ' is-beating' : '')}
				onAnimationEnd={() => setBeating(false)}
				shapeRendering='crispEdges'
				style={{ imageRendering: 'pixelated' }}>
				<rect x='1' y='0' width='2' height='1' fill='#ef4444' />
				<rect x='4' y='0' width='2' height='1' fill='#ef4444' />
				<rect x='0' y='1' width='7' height='1' fill='#ef4444' />
				<rect x='0' y='2' width='7' height='1' fill='#ef4444' />
				<rect x='1' y='3' width='5' height='1' fill='#ef4444' />
				<rect x='2' y='4' width='3' height='1' fill='#ef4444' />
				<rect x='3' y='5' width='1' height='1' fill='#ef4444' />
			</svg>
		</button>
	)
}
