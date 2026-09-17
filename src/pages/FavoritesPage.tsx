import { useLanguage } from '@/i18n/LanguageContext'
import { PlaceholderPage } from '../components/layout/PlaceholderPage'

export default function FavoritesPage() {
  const { t } = useLanguage()
  return (
    <PlaceholderPage title={t('placeholder.favorites.title')} description={t('placeholder.favorites.description')} />
  )
}
