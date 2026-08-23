interface LogoProps {
  ver?: 'small' | 'medium' | 'default';
}

const LOGO_CONFIG = {
  goose: {
    src: 'src/assets/goose-mynted.png',
    width: 150,
  },
  small: {
    src: 'src/assets/goose-mynted-logo-sm.png',
    width: 120,
  },
  medium: {
    src: 'src/assets/goose-mynted-logo-medium.png',
    width: 150,
  },
  default: {
    src: 'src/assets/goose-mynted-logo.png',
    width: 200,
  },
} as const;

export function Logo({ ver }: LogoProps) {
  const config = (ver && LOGO_CONFIG[ver]) ? LOGO_CONFIG[ver] : LOGO_CONFIG.default;

  return (
    <img src={config.src} alt="Mynted Logo" width={config.width} />
  );
}