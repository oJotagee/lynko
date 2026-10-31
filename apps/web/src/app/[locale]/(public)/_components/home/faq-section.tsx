import { useTranslations } from 'next-intl'

import { LynkoMascot } from '../lynko-mascot'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

export function FaqSection() {
  const t = useTranslations('Home.Faq')
  const questions = [
    { id: 'q1', question: t('q1'), answer: t('a1') },
    { id: 'q2', question: t('q2'), answer: t('a2') },
    { id: 'q3', question: t('q3'), answer: t('a3') },
    { id: 'q4', question: t('q4'), answer: t('a4') },
    { id: 'q5', question: t('q5'), answer: t('a5') },
  ]

  return (
    <section className="mx-auto grid w-full max-w-[1250px] grid-cols-[0.8fr_1.2fr] gap-20 px-[30px] py-[140px] max-[900px]:gap-[30px] max-[900px]:px-6 max-[900px]:py-[100px] max-[640px]:grid-cols-1 max-[640px]:gap-8 max-[640px]:px-[14px] max-[640px]:py-16">
      <div>
        <span>{t('label')}</span>
        <h2 className="text-[48px] leading-[1.1] tracking-[-0.04em] max-[640px]:text-[34px]">
          {t('title')}
          <br />
          <em>{t('titleAccent')}</em>
        </h2>
        <LynkoMascot className="mt-[30px]" size="sm" variant="sad" />
      </div>

      <Accordion className="lynko-questions" defaultValue={['q1']}>
        {questions.map(({ id, question, answer }) => (
          <AccordionItem key={id} value={id}>
            <AccordionTrigger>{question}</AccordionTrigger>
            <AccordionContent>
              <p>{answer}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  )
}
