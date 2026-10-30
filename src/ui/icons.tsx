// Line icons from the design system: 16px, round caps, drawn in currentColor
// so they take the text color. Decorative (aria-hidden); the button around
// an icon carries the label.
import React from "react";

type IconProps = { size?: number; className?: string };

const Svg = ({
  size = 16,
  className,
  children,
  fill = "none",
  viewBox = "0 0 16 16",
  strokeWidth = 1.8,
}: IconProps & { children: React.ReactNode; fill?: string; viewBox?: string; strokeWidth?: number }) => (
  <svg
    viewBox={viewBox}
    width={size}
    height={size}
    fill={fill}
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    className={className}
  >
    {children}
  </svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 3v10M3 8h10" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3 3" />
  </Svg>
);

export const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <Svg {...p} fill={filled ? "currentColor" : "none"}>
    <path d="M8 13.5S2.5 10.2 2.5 6.3A2.8 2.8 0 0 1 8 4.9a2.8 2.8 0 0 1 5.5 1.4c0 3.9-5.5 7.2-5.5 7.2Z" />
  </Svg>
);

export const MoreIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor">
    <circle cx="3.5" cy="8" r="1.5" stroke="none" />
    <circle cx="8" cy="8" r="1.5" stroke="none" />
    <circle cx="12.5" cy="8" r="1.5" stroke="none" />
  </Svg>
);

export const GripIcon = () => (
  <svg viewBox="0 0 10 14" width="10" height="14" fill="currentColor" aria-hidden="true" focusable="false">
    <circle cx="2.5" cy="2.5" r="1.4" />
    <circle cx="7.5" cy="2.5" r="1.4" />
    <circle cx="2.5" cy="7" r="1.4" />
    <circle cx="7.5" cy="7" r="1.4" />
    <circle cx="2.5" cy="11.5" r="1.4" />
    <circle cx="7.5" cy="11.5" r="1.4" />
  </svg>
);

export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Svg>
);

// A cog, drawn on a 24px grid (a 2.2 stroke there is about 1.5px at 16px)
export const GearIcon = (p: IconProps) => (
  <Svg {...p} viewBox="0 0 24 24" strokeWidth={2.2}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </Svg>
);

export const PanelIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="3" width="12" height="10" rx="2" />
    <path d="M10 3v10" />
  </Svg>
);

export const BackIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 8H3M7 4 3 8l4 4" />
  </Svg>
);

export const ExternalIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9 3h4v4M13 3 7.5 8.5M11.5 9.5v2.5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1h2.5" />
  </Svg>
);

export const EyeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M1.8 8S4 3.8 8 3.8 14.2 8 14.2 8 12 12.2 8 12.2 1.8 8 1.8 8Z" />
    <circle cx="8" cy="8" r="2" />
  </Svg>
);

export const EyeOffIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6.6 4a6 6 0 0 1 1.4-.2c4 0 6.2 4.2 6.2 4.2a10 10 0 0 1-1.6 2.1M4.2 5.2A10 10 0 0 0 1.8 8S4 12.2 8 12.2a6 6 0 0 0 2.9-.8M2.5 2.5l11 11" />
  </Svg>
);

export const TrashIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.8 4.5h10.4M6.3 4.5V3h3.4v1.5M4 4.5l.6 8.3a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9l.6-8.3" />
  </Svg>
);

export const TagIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 2.5h5l6 6-5 5-6-6v-5Z" />
    <circle cx="5.5" cy="5.5" r="0.9" fill="currentColor" stroke="none" />
  </Svg>
);

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3.5 8.5 3 3 6-7" />
  </Svg>
);

export const PencilIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M10.5 2.8 13.2 5.5 5.5 13.2H2.8v-2.7l7.7-7.7Z" />
  </Svg>
);

export const TargetIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="5.2" />
    <circle cx="8" cy="8" r="1.6" fill="currentColor" stroke="none" />
    <path d="M8 1.2v2M8 12.8v2M1.2 8h2M12.8 8h2" />
  </Svg>
);

export const PinIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.8 2.5 13.5 6.2 11.6 7.1 9.4 9.3 9 12 4 7l2.7-.4 2.2-2.2.9-1.9Z" />
    <path d="M6.5 9.5 2.8 13.2" />
  </Svg>
);

export const CollapseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6h10M4.5 10h7" />
  </Svg>
);

export const ExpandIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3" y="3" width="10" height="10" rx="2" />
    <path d="M3 6.5h10" />
  </Svg>
);

/** Points up to fold a note away, down to open it again */
export const ChevronIcon = ({ up, ...p }: IconProps & { up: boolean }) => (
  <Svg {...p}>
    <path d={up ? "M4 10l4-4 4 4" : "M4 6l4 4 4-4"} />
  </Svg>
);

/** Cards spread on a board */
export const BoardIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2" y="2.5" width="5.5" height="5" rx="1" />
    <rect x="9" y="4" width="5" height="4.5" rx="1" />
    <rect x="3.5" y="9.5" width="5" height="4.5" rx="1" />
  </Svg>
);

export const BringHereIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="3" width="11" height="10" rx="2" />
    <path d="M8 5.5v5M5.8 8.3 8 10.5l2.2-2.2" />
  </Svg>
);

export const PageIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 2h5.5L12.5 5v9h-8.5V2Z" />
    <path d="M9.5 2v3h3" />
  </Svg>
);

// Two pages, one behind the other: a note on more than one page
export const PagesIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 4.5h5L13.5 7v7.5H6V4.5Z" />
    <path d="M10 1.5H3.5v9" />
  </Svg>
);

// Two arrows pointing apart: open something bigger
export const OpenIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M9.5 3H13v3.5M13 3 8.5 7.5M6.5 13H3V9.5M3 13l4.5-4.5" />
  </Svg>
);
