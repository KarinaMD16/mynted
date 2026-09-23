import { z } from 'zod'
import type { TranslateFn } from './LanguageContext'

/**
 * Traduce los mensajes que Zod genera por su cuenta, o sea los de las reglas
 * que no traen un mensaje propio en el schema (por ejemplo un `.int()` o un
 * `.positive()` sin `{ message }`, o un valor de tipo equivocado). Sin esto
 * esos mensajes salen siempre en inglés ("Invalid input: expected string,
 * received number"), sin importar el idioma de la app.
 *
 * No usamos los locales que trae Zod (`z.locales.es()`, etc.) porque arman
 * las frases con el nombre técnico del tipo ("se esperaba int, recibido
 * número"), que no se lee natural. En cambio sacamos el texto del mismo
 * diccionario que el resto de la UI (claves `validation.zod.*`).
 *
 * Prioridad de Zod: el mensaje escrito en el schema (`t('validation.xxx')`)
 * siempre gana; este mapa solo se usa cuando la regla no tiene uno. Si
 * devolvemos `undefined`, Zod usa su mensaje por defecto.
 */
export function makeZodErrorMap(t: TranslateFn): z.core.$ZodErrorMap {
  return (issue) => {
    switch (issue.code) {
      case 'invalid_type': {
        if (issue.input === undefined || issue.input === null) return t('validation.zod.required')
        if (issue.expected === 'int') return t('validation.zod.notInteger')
        return t('validation.zod.invalidType')
      }

      case 'too_small': {
        const min = Number(issue.minimum)
        if (issue.origin === 'string') {
          return min <= 1 ? t('validation.zod.required') : t('validation.zod.tooSmallString', { min })
        }
        if (issue.origin === 'array' || issue.origin === 'set') {
          return min <= 1 ? t('validation.zod.tooSmallArrayOne') : t('validation.zod.tooSmallArray', { min })
        }
        if (issue.origin === 'number' || issue.origin === 'int' || issue.origin === 'bigint') {
          return issue.inclusive
            ? t('validation.zod.tooSmallNumber', { min })
            : t('validation.zod.tooSmallNumberExclusive', { min })
        }
        return t('validation.zod.invalidType')
      }

      case 'too_big': {
        const max = Number(issue.maximum)
        if (issue.origin === 'string') return t('validation.zod.tooBigString', { max })
        if (issue.origin === 'array' || issue.origin === 'set') {
          return max === 1 ? t('validation.zod.tooBigArrayOne') : t('validation.zod.tooBigArray', { max })
        }
        if (issue.origin === 'number' || issue.origin === 'int' || issue.origin === 'bigint') {
          return issue.inclusive
            ? t('validation.zod.tooBigNumber', { max })
            : t('validation.zod.tooBigNumberExclusive', { max })
        }
        return t('validation.zod.invalidType')
      }

      case 'invalid_format':
        return issue.format === 'email' ? t('validation.emailInvalid') : t('validation.zod.invalidFormat')

      case 'invalid_value':
        return t('validation.zod.invalidOption')

      default:
        return t('validation.zod.invalidType')
    }
  }
}
