export function ArrowRight({ size = 22, ...props }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>;
}

export function Eye({ size = 20, ...props }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg>;
}

export function EyeOff({ size = 20, ...props }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="m3 3 18 18"/><path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6 0 9.5 6 9.5 6a16.4 16.4 0 0 1-3.2 3.7"/><path d="M6.3 6.3C3.9 8.1 2.5 12 2.5 12s3.5 6 9.5 6c1.1 0 2.1-.2 3-.5"/></svg>;
}

export function MessageCircle({ size = 28, ...props }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>;
}

export function RefreshCw({ size = 30, ...props }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="M21 12a9 9 0 0 0-15.2-6.5L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15.2 6.5L21 16"/><path d="M21 21v-5h-5"/></svg>;
}

export function Sparkles({ size = 27, ...props }) {
  return <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d="m12 3-1.1 3.1a4.1 4.1 0 0 1-2.5 2.5L5.3 9.7l3.1 1.1a4.1 4.1 0 0 1 2.5 2.5L12 16.4l1.1-3.1a4.1 4.1 0 0 1 2.5-2.5l3.1-1.1-3.1-1.1a4.1 4.1 0 0 1-2.5-2.5L12 3Z"/><path d="m19 16-.5 1.5L17 18l1.5.5L19 20l.5-1.5L21 18l-1.5-.5L19 16Z"/></svg>;
}
