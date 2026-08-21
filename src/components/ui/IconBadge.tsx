export type IconBadgeVariant = 'recurring' | 'hsbc-debit' | 'hsbc-credit' | 'monzo' | 'halifax';

export type IconBadgeSize = 'large' | 'small';

const surfaces = {
  container: 'bg-surface-container-white-background',
  translucent: 'bg-surface-selectable-transparent-background-hover',
} as const;

const sizes = {
  large: { badge: 'size-icon-l', slot: 'size-icon-s' },
  small: { badge: 'size-icon-s', slot: 'size-icon-xs' },
} as const;

type VariantSpec = {
  src: string;
  label: string;
  surface: keyof typeof surfaces;
  /**
   * Figma's recurring glyph uses inset 8.33% inside the icon slot.
   * Brand marks fill the slot and rely on their own viewBox padding.
   */
  scale: 'full' | 'inset';
  /** Monochrome glyphs take a token colour so they follow the theme. */
  tinted?: boolean;
};

const variants: Record<IconBadgeVariant, VariantSpec> = {
  recurring: {
    src: '/icons/recurring.svg',
    label: 'Recurring payment',
    surface: 'container',
    scale: 'inset',
    tinted: true,
  },
  'hsbc-debit': {
    src: '/icons/hsbc.svg',
    label: 'HSBC debit card',
    surface: 'container',
    scale: 'full',
  },
  'hsbc-credit': {
    src: '/icons/hsbc.svg',
    label: 'HSBC credit card',
    surface: 'translucent',
    scale: 'full',
  },
  monzo: {
    src: '/icons/monzo.svg',
    label: 'Monzo',
    surface: 'container',
    scale: 'full',
  },
  halifax: {
    src: '/icons/halifax.svg',
    label: 'Halifax',
    surface: 'translucent',
    scale: 'full',
  },
};

export interface IconBadgeProps {
  variant: IconBadgeVariant;
  size?: IconBadgeSize;
  /** Overrides the variant's own accessible name. */
  label?: string;
  className?: string;
}

export function IconBadge({ variant, size = 'large', label, className = '' }: IconBadgeProps) {
  const spec = variants[variant];
  const { badge, slot } = sizes[size];

  return (
    <span
      role="img"
      aria-label={label ?? spec.label}
      className={`grid shrink-0 place-items-center rounded-container-pill border-[length:var(--token-border-width-selectable-s)] border-solid border-border-subtle ${surfaces[spec.surface]} ${badge} ${className}`}
    >
      <span className={`relative ${slot}`}>
        {spec.tinted ? (
          <span
            className={`${spec.scale === 'inset' ? 'absolute inset-[8.33%]' : 'absolute inset-0'} bg-icon-icon-secondary mask-contain mask-center mask-no-repeat`}
            style={{ maskImage: `url(${spec.src})`, WebkitMaskImage: `url(${spec.src})` }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- next/image cannot optimise SVG without dangerouslyAllowSVG
          <img
            src={spec.src}
            alt=""
            className="absolute inset-0 m-auto block max-h-full max-w-full object-contain"
          />
        )}
      </span>
    </span>
  );
}
