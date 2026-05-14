import type { ReactNode } from 'react'

type IconProps = { size?: number; stroke?: string }

function icon(size: number, stroke: string, children: ReactNode): ReactNode {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke={stroke}
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  )
}

export function proyectosIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <path d="M2 5h3.5l1.5-1.5h6V12H2z" />)
}

export function productosIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M7 2L12.5 5v4L7 12 1.5 9V5z" />
    <path d="M7 2v10" />
    <path d="M1.5 5l5.5 3 5.5-3" />
  </>)
}

export function fuentesIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M2 12.5h10" />
    <path d="M3.5 12.5v-9L7 1.5l3.5 2v9" />
    <path d="M5.5 12.5V9.5h3v3" />
    <path d="M5.5 5h.5M8 5h.5M5.5 7h.5M8 7h.5" />
  </>)
}

export function datasetsIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <rect x="1.5" y="2" width="11" height="10" rx="1" />
    <path d="M1.5 5.5h11" />
    <path d="M5.5 5.5v6.5" />
    <path d="M9 5.5v6.5" />
  </>)
}

export function edicionesIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M4 1.5h6a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9a1 1 0 011-1z" />
    <path d="M4.5 1.5h5v2h-5z" />
    <path d="M5 6h4M5 8.5h4M5 11h2.5" />
  </>)
}

export function distribucionesIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M5.5 8.5A3 3 0 009 9.5l1.5-1.5A3 3 0 007 3L5.5 4.5" />
    <path d="M8.5 5.5A3 3 0 005 4.5L3.5 6A3 3 0 007 11l1.5-1.5" />
  </>)
}

export function basesDeDatosIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <ellipse cx="7" cy="3.5" rx="5" ry="1.5" />
    <path d="M2 3.5v7c0 .8 2.2 1.5 5 1.5s5-.7 5-1.5v-7" />
    <path d="M2 7c0 .8 2.2 1.5 5 1.5S12 7.8 12 7" />
  </>)
}

export function informacionTablasIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <rect x="1.5" y="2" width="11" height="10" rx="1" />
    <path d="M1.5 5.5h11" />
    <path d="M5.5 5.5v6.5" />
    <path d="M9 5.5v6.5" />
  </>)
}

export function archivosIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M3.5 1.5h5.5L12.5 5v8H3.5z" />
    <path d="M9.5 1.5V5H12.5" />
  </>)
}

export function entidadesIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M2 12.5h10" />
    <path d="M3.5 12.5v-9L7 1.5l3.5 2v9" />
    <path d="M5.5 12.5V9.5h3v3" />
    <path d="M5.5 5h.5M8 5h.5M5.5 7h.5M8 7h.5" />
  </>)
}

export function usuariosIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <circle cx="5.5" cy="4.5" r="2.5" />
    <path d="M1 12.5c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" />
    <circle cx="10" cy="4.5" r="2" />
    <path d="M11.5 8.5c1.2.5 2 1.7 2 4" />
  </>)
}

export function nombreIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <path d="M2 4h10M2 7h7M2 10h9" />)
}

export function descripcionIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <path d="M2 3.5h10M2 6.5h10M2 9.5h6.5" />)
}

export function fechaIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <rect x="1.5" y="2.5" width="11" height="9.5" rx="1.5" />
    <path d="M10 1.5v2M4 1.5v2M1.5 6h11" />
  </>)
}

export function correoIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <rect x="1.5" y="3.5" width="11" height="7.5" rx="1" />
    <path d="M1.5 4.5l5.5 4 5.5-4" />
  </>)
}

export function rolIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <path d="M7 1.5L2 4v4c0 3 2.5 4.5 5 5 2.5-.5 5-2 5-5V4z" />)
}

export function estadoIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <rect x="1.5" y="4.5" width="11" height="5" rx="2.5" />
    <circle cx="9.5" cy="7" r="2" fill="currentColor" stroke="none" />
  </>)
}

export function relojIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <circle cx="7" cy="7" r="5.5" />
    <path d="M7 4v3.5l2.5 1.5" />
  </>)
}

export function cuentaIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <circle cx="7" cy="7" r="5.5" />
    <circle cx="7" cy="5.5" r="2" />
    <path d="M3 11.5a4.5 4.5 0 018 0" />
  </>)
}

export function temaIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M2 7L7 1.5h5V7L7 12.5z" />
    <circle cx="9.5" cy="4.5" r="1" fill="currentColor" stroke="none" />
  </>)
}

export function frecuenciaIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M2.5 9.5A5 5 0 1011.5 7" />
    <path d="M11.5 4v3h-3" />
  </>)
}

export function urlIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M6 8l2-2" />
    <path d="M4.5 9.5L3 11a1.4 1.4 0 010-2l2-2a1.4 1.4 0 012 0" />
    <path d="M9.5 4.5L11 3a1.4 1.4 0 010 2l-2 2a1.4 1.4 0 01-2 0" />
  </>)
}

export function productoTablasIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <rect x="1.5" y="2" width="4" height="4" rx="0.5" />
    <rect x="8.5" y="8" width="4" height="4" rx="0.5" />
    <path d="M5.5 4L8.5 10" />
  </>)
}

export function jsonIcon({ size = 12, stroke = 'currentColor' }: IconProps = {}): ReactNode {
  return icon(size, stroke, <>
    <path d="M4 2.5C3 2.5 2.5 3 2.5 4v1.5c0 .8-.5 1.5-1 1.5.5 0 1 .7 1 1.5V10c0 1 .5 1.5 1.5 1.5" />
    <path d="M10 2.5c1 0 1.5.5 1.5 1.5v1.5c0 .8.5 1.5 1 1.5-.5 0-1 .7-1 1.5V10c0 1-.5 1.5-1.5 1.5" />
  </>)
}
