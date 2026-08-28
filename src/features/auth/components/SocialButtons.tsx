import { Button } from "@/components/ui/Button"
import { FacebookIcon, GoogleIcon } from "@/components/ui/SocialIcons"
import { startOAuth } from "../services/authServices"

/**
 * El login social no es una llamada al backend sino una navegación completa:
 * al hacer click el navegador se va al proveedor y vuelve a /auth/callback.
 * Por eso no hay estado de carga ni de error acá — esta página deja de existir.
 */
export function SocialButtons() {
  return (
    <div className="flex w-full flex-col gap-3.5">
      <div className="flex w-full items-center gap-3">
        <div className="h-px flex-1 bg-mynted-border" />
        <span className="text-[12px] font-medium text-mynted-gray">Or sign in with</span>
        <div className="h-px flex-1 bg-mynted-border" />
      </div>

      <div className="flex w-full gap-3">
        <Button
          type="button"
          variant="facebook"
          className="!w-auto flex-1 hover:cursor-pointer"
          onClick={() => startOAuth('facebook')}
        >
          <FacebookIcon />
          Facebook
        </Button>
        <Button
          type="button"
          variant="google"
          className="!w-auto flex-1 hover:cursor-pointer"
          onClick={() => startOAuth('google')}
        >
          <GoogleIcon />
          Google
        </Button>
      </div>
    </div>
  )
}
