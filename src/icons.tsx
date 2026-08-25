import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return { width: 18, height: 18, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, ...props };
}

export function IconSpark(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 3c.3 3.1 1.2 5.1 2.9 6.8C16.6 11.5 18.6 12.4 21.7 12.7c-3.1.3-5.1 1.2-6.8 2.9-1.7 1.7-2.6 3.7-2.9 6.8-.3-3.1-1.2-5.1-2.9-6.8C7.4 13.9 5.4 13 2.3 12.7c3.1-.3 5.1-1.2 6.8-2.9C10.8 8.1 11.7 6.1 12 3Z" />
    </svg>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <svg {...base({ width: 16, height: 16, ...props })}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function IconCanvas(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="5" width="16" height="14" rx="2" />
      <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="14" cy="9" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconNotes(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M7 4h8l4 4v12H7z" />
      <path d="M15 4v4h4M9 12h6M9 16h4" />
    </svg>
  );
}

export function IconHelp(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1.4.8-1.4 1.7V14" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function IconGear(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.4 6.4l1.4 1.4M16.2 16.2l1.4 1.4M17.6 6.4l-1.4 1.4M7.8 16.2l-1.4 1.4" />
    </svg>
  );
}

export function IconSend(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M4 12 20 5l-6 14-2.2-5.8L4 12Z" />
    </svg>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconMinus(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14" />
    </svg>
  );
}
