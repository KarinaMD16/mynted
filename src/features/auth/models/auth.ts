export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
}

export interface AuthUser {
  id: string
  email: string
  username: string
  photoUrl: string
  createdAt: string
  updatedAt: string
}

export interface LogoutResponse {
  message: string
}
