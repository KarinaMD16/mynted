
export interface GoogleCredentialResponse {
  credential?: string
}

export interface GoogleButtonOptions {
  type?: 'standard' | 'icon'
  theme?: 'outline' | 'filled_blue' | 'filled_black'
  size?: 'small' | 'medium' | 'large'
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin'
  shape?: 'rectangular' | 'pill' | 'circle' | 'square'
  logo_alignment?: 'left' | 'center'
  width?: number
}

export interface GoogleAccountsId {
  initialize(config: {
    client_id: string
    callback: (response: GoogleCredentialResponse) => void
    ux_mode?: 'popup' | 'redirect'
    auto_select?: boolean
    cancel_on_tap_outside?: boolean
  }): void
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void
  disableAutoSelect(): void
}

export interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown'
  authResponse?: { accessToken?: string } | null
}

export interface FacebookSdk {
  init(config: { appId: string; cookie?: boolean; xfbml?: boolean; version: string }): void
  login(
    callback: (response: FacebookLoginResponse) => void,
    options?: { scope?: string },
  ): void
}

export interface SocialButtonsProps {
  onAuthenticated?: () => void
}