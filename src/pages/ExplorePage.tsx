import { useLanguage } from '@/i18n/LanguageContext'
import { PlaceholderPage } from '../components/layout/PlaceholderPage'

export default function ExplorePage() {
  const { t } = useLanguage()
  return <PlaceholderPage title={t('placeholder.explore.title')} description={t('placeholder.explore.description')} />
}
