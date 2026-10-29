import type { CSSProperties, SVGProps } from "react";

type BrandIconProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function BrandIcon({ size = 48, style, ...props }: BrandIconProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      fill="none"
      role="img"
      aria-label="CCPF"
      style={{ flexShrink: 0, ...style } as CSSProperties}
      {...props}
    >
      <circle
        cx="32"
        cy="32"
        r="26"
        stroke="#06B6D4"
        strokeWidth="8"
        strokeDasharray="82 82"
        transform="rotate(-90 32 32)"
      />
      <circle
        cx="32"
        cy="32"
        r="26"
        stroke="#4F46E5"
        strokeWidth="8"
        strokeDasharray="82 82"
        strokeDashoffset="-82"
        transform="rotate(-90 32 32)"
      />
      <path
        d="M23 39V29M32 44V19M41 35V23"
        stroke="#625BFF"
        strokeWidth="5"
        strokeLinecap="round"
      />
    </svg>
  );
}
