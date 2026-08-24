const paths = {
  activity: 'M3 12h4l2-8 4 16 2-8h6',
  chart: 'M4 19V5m0 14h16M8 16v-4m4 4V8m4 8v-6',
  goal: 'M12 3v18m0-18a9 9 0 1 0 9 9h-9V3Z',
  workout: 'M6 7v10m12-10v10M3 10v4m18-4v4M6 12h12',
  nutrition: 'M6 3c0 3 2 4 6 4s6-1 6-4M8 7v11a4 4 0 0 0 8 0V7M9 21h6',
  progress: 'M4 19V5m0 14h16M7 15l3-4 3 2 4-6',
  user: 'M20 21a8 8 0 0 0-16 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  settings: 'M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm0-12v2m0 13v2M4.22 4.22l1.42 1.42m12.72 12.72 1.42 1.42M1.5 12h2m17 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42',
  lock: 'M6 10V7a6 6 0 0 1 12 0v3m-13 0h14v10H5V10Z',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  mail: 'M3 5h18v14H3V5Zm0 1 9 7 9-7',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  plus: 'M12 5v14m-7-7h14',
  trash: 'M4 7h16m-10 4v6m4-6v6M9 7V4h6v3m-9 0 1 14h10l1-14',
  download: 'M12 3v12m0 0 5-5m-5 5-5-5M4 21h16',
  logout: 'M10 17l5-5-5-5m5 5H3m10-8V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-3',
  chevron: 'm9 18 6-6-6-6',
  calendar: 'M5 4h14v16H5V4Zm3-2v4m8-4v4M5 9h14',
  check: 'm5 12 4 4L19 6',
  info: 'M12 11v6m0-10h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  shield: 'M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z',
  flame: 'M12 21c4 0 7-2.8 7-7 0-2.8-1.5-5.2-4.5-8.2.1 2.4-1 3.7-2.4 4.6C12.6 7.7 11 5.6 8.2 4 8.7 7.5 6 9.4 6 13.5 6 18 8.7 21 12 21Z',
  water: 'M12 2s7 7.2 7 12a7 7 0 1 1-14 0c0-4.8 7-12 7-12Z',
  home: 'm3 11 9-8 9 8v9H3v-9Zm6 9v-6h6v6',
  search: 'M21 21l-4.3-4.3M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z',
  chevronLeft: 'm15 18-6-6 6-6',
  chevronRight: 'm9 18 6-6-6-6',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-6v2m0 16v2M4.2 4.2l1.4 1.4m12.8 12.8 1.4 1.4M2 12h2m16 0h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z',
  utensils: 'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
  cookie: 'M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5Zm-2.5 5.5h.01M6 12h.01M9.5 16h.01M14 14h.01M17 9h.01',
  droplet: 'M12 2s7 7.2 7 12a7 7 0 1 1-14 0c0-4.8 7-12 7-12Z',
  lightbulb: 'M9 18h6m-5 3h4M12 3a6 6 0 0 1 4 10.5c-.7.6-1 1.4-1 2.5h-6c0-1.1-.3-1.9-1-2.5A6 6 0 0 1 12 3Z',
  sparkles: 'm12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Zm6 12 .8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z',
  bookmark: 'M5 3h14v18l-7-4-7 4V3Z',
  barcode: 'M4 5v14M8 5v14m4-14v14m4-14v14m4-14v14',
};

export default function Icon({ name, size = 16, strokeWidth = 1.8, className = '' }) {
  const d = paths[name] || paths.info;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}