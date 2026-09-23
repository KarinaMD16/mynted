import gooseMynted from '@/assets/goose-mynted.png'
import gooseMyntedLogo from '@/assets/goose-mynted-logo.png'
import gooseMyntedLogoSm from '@/assets/goose-mynted-logo-sm.png'

interface LogoProps {
  ver?: 'small' | 'medium' | 'default';
  className?: string;
}

/**
 * Las imágenes se importan (en vez de usar un string tipo 'src/assets/...')
 * para que Vite las resuelva a su URL final del bundle. Con la ruta relativa
 * el logo se rompía en cualquier ruta anidada, porque el navegador la
 * resolvía contra el path actual: en /communities/1 pedía
 * /communities/src/assets/... y daba 404.
 */
const LOGO_CONFIG = {
  goose: {
    src: gooseMynted,
    width: 150,
  },
  small: {
    src: gooseMyntedLogoSm,
    width: 120,
  },
  // No existe un archivo "medium" propio: usa el logo normal, solo más chico.
  medium: {
    src: gooseMyntedLogo,
    width: 150,
  },
  default: {
    src: gooseMyntedLogo,
    width: 200,
  },
} as const;

export function Logo({ ver, className }: LogoProps) {
  const config = (ver && LOGO_CONFIG[ver]) ? LOGO_CONFIG[ver] : LOGO_CONFIG.default;

  return (
    <img src={config.src} alt="Mynted Logo" width={config.width} className={className} />
  );
}
