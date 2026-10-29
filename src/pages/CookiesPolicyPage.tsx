import { cx } from '@/utils/cx'
import { PAGE_CONTAINER } from '@/components/layout/pageContainer'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { cookiesPolicyContent } from '@/features/auth/legal/cookiesPolicyContent'
import { useLanguage } from '@/i18n/LanguageContext'

export default function CookiesPolicyPage() {
  const { language } = useLanguage()
  const content = cookiesPolicyContent[language]

  return (
    <div className="min-h-svh bg-mynted-bg">
      <SiteHeader />

      <main className={cx(PAGE_CONTAINER, 'pt-6 pb-16')}>
        <article className="prose prose-sm max-w-none rounded-2xl border border-mynted-border bg-mynted-white p-6 sm:p-10 lg:px-14 [&>*]:max-w-[80ch]">
          <div className="not-prose mb-2 flex items-center justify-end">
            <LanguageSwitcher />
          </div>

          <h1>{content.title}</h1>

          {content.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              {section.body}
            </section>
          ))}
        </article>
      </main>
    </div>
  )
}
