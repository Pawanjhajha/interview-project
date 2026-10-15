// Minimal inline icon set (24px grid, stroke based) so no icon library is needed.
const PATHS = {
  logo: 'M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z M9 12l2 2 4-4',
  mail: 'M4 6h16v12H4z M4 7l8 6 8-6',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8z M4 21c0-4 3.6-6 8-6s8 2 8 6',
  lock: 'M6 11h12v9H6z M8 11V8a4 4 0 118 0v3',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M12 15a3 3 0 100-6 3 3 0 000 6z',
  eyeOff: 'M3 3l18 18 M10.6 6.2A9.6 9.6 0 0112 6c6.5 0 10 6 10 6a17 17 0 01-3.2 3.9 M6.5 7.5A16.7 16.7 0 002 12s3.5 6 10 6c1.6 0 3-.4 4.3-1 M9.9 9.9a3 3 0 004.2 4.2',
  logout: 'M9 4H5v16h4 M16 8l4 4-4 4 M20 12H9',
  alert: 'M12 3l10 18H2L12 3z M12 10v4 M12 17.5v.5',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18z M12 11v5 M12 7.5v.5',
  calendar: 'M4 6h16v14H4z M4 10h16 M8 3v4 M16 3v4',
  shield: 'M12 3l8 3v6c0 4.5-3.2 8.3-8 9-4.8-.7-8-4.5-8-9V6l8-3z',
  inbox: 'M3 13l3-8h12l3 8v6H3v-6z M3 13h5l1 2h6l1-2h5',
  home: 'M3 11l9-8 9 8 M5 10v10h14V10',
  store: 'M4 9l1.5-5h13L20 9 M4 9a2.7 2.7 0 005.3 0 2.7 2.7 0 005.4 0A2.7 2.7 0 0020 9 M5 12v8h14v-8 M10 20v-5h4v5',
  box: 'M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z M4 7.5l8 4.5 8-4.5 M12 12v9',
  plus: 'M12 5v14 M5 12h14',
  edit: 'M4 20h4L19 9l-4-4L4 16v4z M13.5 6.5l4 4',
  trash: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13 M10 11v5 M14 11v5',
  arrowLeft: 'M19 12H5 M11 6l-6 6 6 6',
  check: 'M5 12.5l4.5 4.5L19 7',
  minus: 'M5 12h14',
  cart: 'M3 4h2l2.4 11h11L21 7H6 M9 20a1 1 0 100-2 1 1 0 000 2z M17 20a1 1 0 100-2 1 1 0 000 2z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  chart: 'M4 20h16 M7 20v-7 M12 20V6 M17 20v-10',
  receipt: 'M6 3h12v18l-3-2-3 2-3-2-3 2V3z M9 8h6 M9 12h6',
}

export default function Icon({ name, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
