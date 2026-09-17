import { SiteHeader } from '@/components/layout/SiteHeader'
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher'
import { cookiesPolicyContent } from '@/features/auth/legal/cookiesPolicyContent'
import { useLanguage } from '@/i18n/LanguageContext'

export default function CookiesPolicyPage() {
  const { language } = useLanguage()
  const content = cookiesPolicyContent[language]

  return (
    <div className="min-h-svh bg-mynted-bg">
      <div className="px-4 pt-5 sm:px-6">
        <SiteHeader />
      </div>

      <main className="mx-auto max-w-[760px] px-4 pt-6 pb-16 sm:px-6">
        <article className="prose prose-sm max-w-none rounded-2xl border border-mynted-border bg-mynted-white p-6 sm:p-10">
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
