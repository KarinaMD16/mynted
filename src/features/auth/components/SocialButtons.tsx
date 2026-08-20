import { Button } from "@/components/ui/Button"
import { FacebookIcon, GoogleIcon } from "@/components/ui/SocialIcons"
import { useSocialLoginMutation } from "../hooks/useAuthMutations"


export function SocialButtons() {
  const socialLogin = useSocialLoginMutation()

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
          className="!w-auto flex-1"
          onClick={() => socialLogin.mutate('facebook')}
        >
          <FacebookIcon />
          Facebook
        </Button>
        <Button
          type="button"
          variant="google"
          className="!w-auto flex-1"
          onClick={() => socialLogin.mutate('google')}
        >
          <GoogleIcon />
          Google
        </Button>
      </div>

      {socialLogin.isError && (
        <p className="text-center text-xs text-red-500" role="alert">
          {(socialLogin.error as Error).message}
        </p>
      )}
    </div>
  )
}
