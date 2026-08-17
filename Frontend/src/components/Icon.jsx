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
};

export default function Icon({ name, size = 16, strokeWidth = 1.8, className = '' }) {
  const d = paths[name] || paths.info;
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}