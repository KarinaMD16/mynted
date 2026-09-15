import { useLanguage } from '@/i18n/LanguageContext'
import { PlaceholderPage } from '../components/layout/PlaceholderPage'

export default function MessagesPage() {
  const { t } = useLanguage()
  return (
    <PlaceholderPage title={t('placeholder.messages.title')} description={t('placeholder.messages.description')} />
  )
}
