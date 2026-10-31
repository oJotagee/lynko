'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { LynkoMascot } from './_components/lynko-mascot'

const palettes = [
  { id: 'lime', name: 'Lima', background: '#e9ff9e', swatch: '#b7f34a' },
  { id: 'violet', name: 'Violeta', background: '#ded8ff', swatch: '#9b8cff' },
  { id: 'peach', name: 'Pêssego', background: '#ffd2c5', swatch: '#ff8d6b' },
  { id: 'ink', name: 'Grafite', background: '#1f2022', swatch: '#38383c' },
] as const

function Logo() {
  return (
    <Link href="/" className="lynko-home-logo" aria-label="Lynko, página inicial">
      <span className="lynko-logo-mark" aria-hidden="true"><i /><i /></span>
      <strong>lynko</strong>
    </Link>
  )
}

function PhonePreview({ theme = 'lime', progress = 1, className = '' }: { theme?: string; progress?: number; className?: string }) {
  const rotation = 28 - progress * 23
  const depth = 0.78 + progress * 0.22

  return (
    <div className={`lynko-phone lynko-phone-${theme} ${className}`} style={{ transform: `perspective(900px) rotateY(${rotation}deg) rotateZ(${(1 - progress) * -4}deg) scale(${depth})` }}>
      <div className="lynko-phone-status"><b>9:41</b><span aria-hidden="true">•••</span></div>
      <button className="lynko-phone-share" type="button" aria-label="Compartilhar perfil">↗</button>
      <div className="lynko-phone-avatar">MS</div>
      <strong>Maya Santos</strong><small>@maya · Designer de produto</small>
      <p>Criando coisas úteis e compartilhando o que aprendo pelo caminho.</p>
      <div className="lynko-phone-socials"><b>in</b><b>◎</b><b>◉</b><b>♪</b></div>
      <div className="lynko-phone-links">
        <div><i />Meu portfólio <span>→</span></div>
        <div><i />Estudo de caso recente <span>→</span></div>
        <div><i />Marque um café <span>→</span></div>
      </div>
      <small className="lynko-phone-brand">◎ Feito com lynko</small>
    </div>
  )
}

function HomePage() {
  const storyRef = useRef<HTMLElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [palette, setPalette] = useState<(typeof palettes)[number]['id']>('violet')

  useEffect(() => {
    const node = storyRef.current
    if (!node) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const update = () => {
      if (reduceMotion) {
        setScrollProgress(1)
        return
      }

      const bounds = node.getBoundingClientRect()
      const travel = Math.max(1, node.offsetHeight - window.innerHeight)
      setScrollProgress(Math.max(0, Math.min(1, -bounds.top / travel)))
    }

    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [])

  return (
    <div className="lynko-home">
      <header className="lynko-site-header">
        <Logo />
        <nav aria-label="Navegação principal">
          <a href="#features">Recursos</a><a href="#how">Como funciona</a><a href="#pricing">Planos</a>
        </nav>
        <div>
          <Link className="lynko-text-link" href="/login">Entrar</Link>
          <Button asChild className="lynko-primary-button"><Link href="/login">Crie sua Lynko <span>→</span></Link></Button>
        </div>
      </header>

      <main>
        <section className="lynko-hero">
          <div className="lynko-hero-copy">
            <span className="lynko-eyebrow"><i>✳</i> Seu canto na internet</span>
            <h1>Tudo o que você é,<br /><em>a um link de distância.</em></h1>
            <p>Reúna seu trabalho, redes sociais, ideias e lugares favoritos da internet em uma página com a sua cara.</p>
            <div className="lynko-hero-actions">
              <Button asChild className="lynko-primary-button"><Link href="/login">Crie sua Lynko <span>→</span></Link></Button>
              <a className="lynko-secondary-button" href="#features">Conheça um exemplo <span>◎</span></a>
            </div>
            <div className="lynko-social-proof"><span><i>AM</i><i>JK</i><i>RS</i></span><small>Junte-se a mais de 12 mil pessoas<br />construindo seu espaço digital.</small></div>
          </div>
          <div className="lynko-hero-art">
            <i className="lynko-orbit lynko-orbit-one" /><i className="lynko-orbit lynko-orbit-two" />
            <span className="lynko-float-note lynko-note-clicks">↗ 348 novos cliques</span>
            <span className="lynko-float-note lynko-note-theme">◎ Tema atualizado</span>
            <PhonePreview progress={1} /><LynkoMascot size="sm" className="lynko-hero-mascot" />
          </div>
        </section>

        <section className="lynko-trust">
          <p>Um link simples. Infinitas possibilidades.</p>
          <div><b>FOLD</b><b>Northstar®</b><b>the next thing</b><b>ARC / STUDIO</b><b>paperplane</b></div>
        </section>

        <section className="lynko-story" id="features" ref={storyRef}>
          <div className="lynko-section-heading">
            <span>01 / SUA LYNKO</span><h2>Deixe a internet<br /><em>com a sua cara.</em></h2>
            <p>Sem modelos que limitam você. Comece com uma base bonita e personalize cada detalhe.</p>
          </div>
          <div className="lynko-story-stage">
            <div className="lynko-custom-panel">
              <div className="lynko-window"><i /><i /><i /><b>Aparência</b></div>
              <label>Tema</label>
              <div className="lynko-theme-options">{palettes.slice(0, 3).map((item) => <button type="button" key={item.id} aria-pressed={palette === item.id} className={palette === item.id ? 'selected' : ''} onClick={() => setPalette(item.id)}>{item.name}</button>)}</div>
              <label>Plano de fundo</label>
              <div className="lynko-swatches">{palettes.map((item) => <button type="button" key={item.id} aria-label={`Usar tema ${item.name}`} aria-pressed={palette === item.id} onClick={() => setPalette(item.id)} style={{ backgroundColor: item.swatch }} />)}</div>
              <label>Formato do botão</label>
              <div className="lynko-shape-options"><button type="button">Suave</button><button className="active" type="button">Redondo</button><button type="button">Reto</button></div>
            </div>
            <PhonePreview theme={palette} progress={scrollProgress} className="lynko-story-phone" />
            <span className="lynko-quote">“Finalmente parece comigo.”<small>— Maya, ilustradora</small></span>
            <LynkoMascot size="sm" className="lynko-story-mascot" />
          </div>
        </section>

        <section className="lynko-how" id="how">
          <div className="lynko-section-heading centered"><span>02 / COMO FUNCIONA</span><h2>Do caos à clareza<br /><em>em poucos minutos.</em></h2></div>
          <div className="lynko-steps">
            {[
              ['01', 'Escolha seu espaço', 'Defina um nome de usuário e conte o essencial sobre você.', '✳'],
              ['02', 'Reúna seus links', 'Adicione o que vale a pena compartilhar e reorganize quando quiser.', '↗'],
              ['03', 'Deixe com a sua cara', 'Escolha cores, fontes e formatos sem precisar saber design.', '◎'],
              ['04', 'Compartilhe por aí', 'Um link fácil de lembrar para sua bio, e-mail, cartão e conversas.', '→'],
            ].map((step, index) => <article key={step[0]}><span>{step[0]}</span><div className={`lynko-step-art art-${index}`}>{step[3]}{index === 3 && <LynkoMascot size="sm" />}</div><h3>{step[1]}</h3><p>{step[2]}</p></article>)}
          </div>
        </section>

        <section className="lynko-features">
          <article className="lynko-feature-wide">
            <div><span>ANÁLISES EM TEMPO REAL</span><h2>Saiba o que conecta.</h2><p>Descubra o que as pessoas gostam, de onde vêm e como sua Lynko cresce — sem se perder nos dados.</p><a href="#pricing" className="lynko-light-button">Conheça as análises ↗</a></div>
            <div className="lynko-chart"><div><small>VISUALIZAÇÕES DA PÁGINA</small><b>12.842</b><em>+24,8%</em></div><svg viewBox="0 0 500 160" aria-label="Gráfico ilustrativo de crescimento"><path d="M0 140C40 126 53 96 91 110s51-41 92-25 61 54 101 13 51-73 90-59 60 35 126-20" /><path className="fill" d="M0 140C40 126 53 96 91 110s51-41 92-25 61 54 101 13 51-73 90-59 60 35 126-20V160H0Z" /></svg><div className="lynko-bars">{[38, 62, 46, 78, 54, 92, 70].map((height, index) => <i key={index} style={{ height: `${height}%` }} />)}</div></div>
          </article>
          <div className="lynko-feature-split">
            <article><span className="lynko-icon-chip">◎</span><h3>Linda em qualquer tela.</h3><p>Sua página fica bem cuidada do menor celular ao maior computador.</p><PhonePreview theme="peach" progress={1} className="lynko-device-phone" /></article>
            <article className="lynko-feature-lime"><LynkoMascot /><div><span className="lynko-icon-chip">✳</span><h3>Simples e agradável.</h3><p>Sem excessos ou curva de aprendizado. Só o necessário e uma companhia para ajudar.</p></div></article>
          </div>
        </section>

        <section className="lynko-pricing" id="pricing">
          <div className="lynko-section-heading centered"><span>03 / PLANOS</span><h2>Comece de graça.<br /><em>Fique o quanto quiser.</em></h2></div>
          <div className="lynko-price-grid">
            <article><span>GRÁTIS</span><h3>R$ 0 <small>/ para sempre</small></h3><p>Tudo para causar uma ótima primeira impressão.</p><Button asChild className="lynko-primary-button"><Link href="/login">Começar a criar</Link></Button><ul><li>✓ Links ilimitados</li><li>✓ Seis temas exclusivos</li><li>✓ Análises dos últimos 30 dias</li><li>✓ Identidade Lynko</li></ul></article>
            <article className="pro"><b className="lynko-coming-soon">EM BREVE</b><span>PRO</span><h3>R$ 40 <small>/ mês</small></h3><p>Para criadores que querem entender e ampliar sua audiência.</p><Button variant="outline" disabled>Entre na lista de espera</Button><ul><li>✓ Personalização avançada</li><li>✓ Histórico completo de análises</li><li>✓ Domínio próprio</li><li>✓ Remova a marca Lynko</li></ul></article>
          </div>
        </section>

        <section className="lynko-faq">
          <div><span>DÚVIDAS</span><h2>O que você<br />quer <em>saber?</em></h2><LynkoMascot size="sm" /></div>
          <div className="lynko-questions">{['A Lynko é mesmo gratuita?', 'Posso usar meu próprio domínio?', 'Posso mudar meu nome de usuário?', 'O que a Lynko acompanha?', 'Posso cancelar o Pro quando quiser?'].map((question, index) => <details key={question} open={index === 0}><summary>{question}<b>+</b></summary><p>{index === 0 ? 'Sim. Crie uma página, adicione links ilimitados e veja as principais análises sem precisar de cartão.' : 'Sim. A Lynko foi pensada para acompanhar as mudanças da sua presença digital.'}</p></details>)}</div>
        </section>
      </main>

      <footer className="lynko-footer">
        <div><Logo /><h2>Sua internet.<br />Do seu jeito.</h2><Button asChild className="lynko-lime-button"><Link href="/login">Crie sua Lynko →</Link></Button></div>
        <div className="lynko-footer-links"><p><b>Produto</b><a href="#features">Recursos</a><a href="#pricing">Planos</a><Link href="/login">Entrar</Link></p><p><b>Empresa</b><a href="#footer">Sobre</a><a href="#footer">Privacidade</a><a href="#footer">Termos</a></p><p><b>Redes sociais</b><a href="#footer">Instagram</a><a href="#footer">X / Twitter</a><a href="#footer">LinkedIn</a></p></div>
        <LynkoMascot size="sm" /><small id="footer">© 2025 Lynko, Inc. Feita para quem vive conectado.</small>
      </footer>
    </div>
  )
}

export default function Home() {
  return <HomePage />
}
