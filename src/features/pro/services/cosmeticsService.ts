import myntedAPI from '@/api/apiConfig'
import type { Cosmetic, EquipCosmeticsPayload, MyCosmetics } from '../models/cosmetics'

/** GET /cosmetics — catálogo público (solo los activos). */
export async function getCosmeticsCatalog(): Promise<Cosmetic[]> {
  const { data } = await myntedAPI.get<Cosmetic[]>('/cosmetics')
  return data
}

/** GET /users/me/cosmetics — lo equipado (preferencia) y lo efectivo (lo que se pinta). */
export async function getMyCosmetics(): Promise<MyCosmetics> {
  const { data } = await myntedAPI.get<MyCosmetics>('/users/me/cosmetics')
  return data
}

/**
 * PUT /users/me/cosmetics — solo cambia lo que se manda. 403 si es un
 * cosmético Pro sin Pro vigente; 404 si el cosmético ya no existe.
 */
export async function equipCosmetics(payload: EquipCosmeticsPayload): Promise<MyCosmetics> {
  const { data } = await myntedAPI.put<MyCosmetics>('/users/me/cosmetics', payload)
  return data
}

/**
 * PUT /users/me/banner — sube el banner propio (solo Pro). multipart, campo
 * `banner`; JPEG, PNG, WEBP o GIF de hasta 8 MB. Reemplaza el anterior.
 */
export async function uploadCustomBanner(file: File): Promise<MyCosmetics> {
  const formData = new FormData()
  formData.append('banner', file)
  const { data } = await myntedAPI.put<MyCosmetics>('/users/me/banner', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

/** DELETE /users/me/banner — quita el banner propio (no exige Pro; repetirlo no falla). */
export async function deleteCustomBanner(): Promise<void> {
  await myntedAPI.delete('/users/me/banner')
}
