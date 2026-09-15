/**
 * Versión vigente de la Política de Privacidad. Súbela cada vez que cambie el
 * contenido de `/legal/privacidad` (ver PrivacyPolicyPage.tsx): el backend
 * guarda esta cadena tal cual en `privacyPolicyVersion` y su sola presencia
 * en el POST es lo que dispara `acceptedPrivacyPolicyAt = now()` (ver
 * UserTagsService.setUserTags / usersService.updateOnboardingMeta).
 *
 * TODO: idealmente esto sale de un solo lugar compartido con el backend (un
 * endpoint tipo `GET /legal/privacy-policy` que devuelva `{ version, url }`)
 * para que nunca queden desincronizados. Por ahora es un valor "a mano" que
 * hay que mantener igual en los dos lados si el backend llega a validarlo.
 */
export const CURRENT_PRIVACY_POLICY_VERSION = '2026-09-15'

export const PRIVACY_POLICY_PATH = '/legal/privacidad'
