'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'

import { LynkoMascot } from './_components/lynko-mascot'

const palettes = [
  { id: 'lime', name: 'Lime', background: '#e9ff9e', swatch: '#b7f34a' },
  { id: 'violet', name: 'Violet', background: '#ded8ff', swatch: '#9b8cff' },
  { id: 'peach', name: 'Peach', background: '#ffd2c5', swatch: '#ff8d6b' },
  { id: 'ink', name: 'Ink', background: '#1f2022', swatch: '#38383c' },
] as const

function Logo() {
  return <Link href="/" className="lynko-home-logo" aria-label="Lynko, página inicial"><span className="lynko-logo-mark"><i /><i /></span><strong>lynko</strong></Link>
}

function PhonePreview({ theme = 'lime', progress = 1, className = '' }: { theme?: string; progress?: number; className?: string }) {
  const rotation = 28 - progress * 23
  const depth = 0.78 + progress * 0.22
  return <div className={`lynko-phone lynko-phone-${theme} ${className}`} style={{ transform: `perspective(900px) rotateY(${rotation}deg) rotateZ(${(1 - progress) * -4}deg) scale(${depth})` }}>
    <div className="lynko-phone-status"><b>9:41</b><span>Ã¢â€”Â Ã¢â€”â€</span></div>
    <button className="lynko-phone-share" type="button" aria-label="Compartilhar perfil">Ã¢â€ â€”</button>
    <div className="lynko-phone-avatar">MS</div>
    <strong>Maya Santos</strong><small>@maya Ã‚Â· Product designer</small>
    <p>Designing useful things and sharing what I learn along the way.</p>
    <div className="lynko-phone-socials"><b>in</b><b>Ã¢â€”â€°</b><b>Ã¢â€”Â«</b><b>Ã°Ââ€¢Â</b></div>
    <div className="lynko-phone-links"><div><i />My design portfolio <span>Ã¢â€ â€™</span></div><div><i />Latest case study <span>Ã¢â€ â€™</span></div><div><i />Book a coffee chat <span>Ã¢â€ â€™</span></div></div>
    <small className="lynko-phone-brand">Ã¢â€”â€° Made with lynko</small>
  </div>
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
      if (reduceMotion) { setScrollProgress(1); return }
      const bounds = node.getBoundingClientRect()
      const travel = Math.max(1, node.offsetHeight - window.innerHeight)
      setScrollProgress(Math.max(0, Math.min(1, -bounds.top / travel)))
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update) }
  }, [])

  return <div className="lynko-home">
    <header className="lynko-site-header"><Logo /><nav aria-label="NavegaÃƒÂ§ÃƒÂ£o principal"><a href="#features">Features</a><a href="#how">How it works</a><a href="#pricing">Pricing</a></nav><div><Link className="lynko-text-link" href="/login">Entrar</Link><Button asChild className="lynko-primary-button"><Link href="/login">Crie sua Lynko <span>Ã¢â€ â€™</span></Link></Button></div></header>
    <main>
      <section className="lynko-hero"><div className="lynko-hero-copy"><span className="lynko-eyebrow"><i>Ã¢Å“Â³</i> Your corner of the internet</span><h1>Everything you are,<br /><em>one link away.</em></h1><p>Bring your work, socials, ideas, and favorite corners of the internet together on a page that feels unmistakably you.</p><div className="lynko-hero-actions"><Button asChild className="lynko-primary-button"><Link href="/login">Create your Lynko <span>Ã¢â€ â€™</span></Link></Button><a className="lynko-secondary-button" href="#features">Explore an example <span>Ã¢â€”â€°</span></a></div><div className="lynko-social-proof"><span><i>AM</i><i>JK</i><i>RS</i></span><small>Join 12,000+ curious people<br />building their digital home.</small></div></div><div className="lynko-hero-art"><i className="lynko-orbit lynko-orbit-one"/><i className="lynko-orbit lynko-orbit-two"/><span className="lynko-float-note lynko-note-clicks">Ã¢â€ â€”Ã£â‚¬â‚¬348 new clicks</span><span className="lynko-float-note lynko-note-theme">Ã¢â€”â€°Ã£â‚¬â‚¬Theme updated</span><PhonePreview progress={1}/><LynkoMascot size="sm" className="lynko-hero-mascot"/></div></section>
      <section className="lynko-trust"><p>One simple link. Endless possibilities.</p><div><b>FOLD</b><b>NorthstarÃ‚Â®</b><b>the next thing</b><b>ARC / STUDIO</b><b>paperplane</b></div></section>
      <section className="lynko-story" id="features" ref={storyRef}><div className="lynko-section-heading"><span>01 / YOUR LYNKO</span><h2>Make the internet<br /><em>feel like yours.</em></h2><p>No templates that box you in. Start with a beautiful foundation and make every detail feel personal.</p></div><div className="lynko-story-stage"><div className="lynko-custom-panel"><div className="lynko-window"><i/><i/><i/><b>Appearance</b></div><label>Theme</label><div className="lynko-theme-options">{palettes.slice(0,3).map(item=><button type="button" key={item.id} aria-pressed={palette===item.id} className={palette===item.id?'selected':''} onClick={()=>setPalette(item.id)}>{item.name}</button>)}</div><label>Background</label><div className="lynko-swatches">{palettes.map(item=><button type="button" key={item.id} aria-label={`Usar tema ${item.name}`} aria-pressed={palette===item.id} onClick={()=>setPalette(item.id)} style={{backgroundColor:item.swatch}}/>)}</div><label>Button shape</label><div className="lynko-shape-options"><button type="button">Soft</button><button className="active" type="button">Round</button><button type="button">Sharp</button></div></div><PhonePreview theme={palette} progress={scrollProgress} className="lynko-story-phone"/><span className="lynko-quote">Ã¢â‚¬Å“It finally looks like me.Ã¢â‚¬Â<small>Ã¢â‚¬â€ Maya, illustrator</small></span><LynkoMascot size="sm" className="lynko-story-mascot"/></div></section>
      <section className="lynko-how" id="how"><div className="lynko-section-heading centered"><span>02 / HOW IT WORKS</span><h2>From scattered to<br /><em>sorted in minutes.</em></h2></div><div className="lynko-steps">{[['01','Claim your space','Pick a username and add the essentials that make you, you.','Ã¢â„¢â„¢'],['02','Gather your links','Drop in anything worth sharing. Reorder it whenever inspiration hits.','Ã¢â€ â€”'],['03','Make it yours','Choose a mood, color, typeface and shape. No design degree needed.','Ã¢â€”â€°'],['04','Share everywhere','One memorable link for every bio, email, card and conversation.','Ã¢â€ â€”']].map((step,i)=><article key={step[0]}><span>{step[0]}</span><div className={`lynko-step-art art-${i}`}>{step[3]}{i===3&&<LynkoMascot size="sm"/>}</div><h3>{step[1]}</h3><p>{step[2]}</p></article>)}</div></section>
      <section className="lynko-features"><article className="lynko-feature-wide"><div><span>LIVE ANALYTICS</span><h2>Know what connects.</h2><p>See what people love, where they come from, and how your Lynko growsÃ¢â‚¬â€without drowning in data.</p><a href="#pricing" className="lynko-light-button">Explore analyticsÃ£â‚¬â‚¬Ã¢â€ â€™</a></div><div className="lynko-chart"><div><small>PAGE VIEWS</small><b>12,842</b><em>+24.8%</em></div><svg viewBox="0 0 500 160" aria-label="GrÃƒÂ¡fico ilustrativo de crescimento"><path d="M0 140C40 126 53 96 91 110s51-41 92-25 61 54 101 13 51-73 90-59 60 35 126-20"/><path className="fill" d="M0 140C40 126 53 96 91 110s51-41 92-25 61 54 101 13 51-73 90-59 60 35 126-20V160H0Z"/></svg><div className="lynko-bars">{[38,62,46,78,54,92,70].map((height,i)=><i key={i} style={{height:`${height}%`}}/>)}</div></div></article><div className="lynko-feature-split"><article><span className="lynko-icon-chip">Ã¢â€”â€°</span><h3>Beautiful on every screen.</h3><p>Your page feels considered from the smallest phone to the biggest desktop.</p><PhonePreview theme="peach" progress={1} className="lynko-device-phone"/></article><article className="lynko-feature-lime"><LynkoMascot/><div><span className="lynko-icon-chip">Ã¢Å“Â³</span><h3>Delightfully simple.</h3><p>No clutter. No learning curve. Just the tools you need and a small friend when you get stuck.</p></div></article></div></section>
      <section className="lynko-pricing" id="pricing"><div className="lynko-section-heading centered"><span>03 / PRICING</span><h2>Start free.<br /><em>Stay as long as you like.</em></h2></div><div className="lynko-price-grid"><article><span>FREE</span><h3>$0 <small>/ forever</small></h3><p>Everything you need to make your first impression count.</p><Button asChild className="lynko-primary-button"><Link href="/login">Start creating</Link></Button><ul><li>Ã¢Å“â€œÃ£â‚¬â‚¬Unlimited links</li><li>Ã¢Å“â€œÃ£â‚¬â‚¬Six signature themes</li><li>Ã¢Å“â€œÃ£â‚¬â‚¬30-day analytics</li><li>Ã¢Å“â€œÃ£â‚¬â‚¬Lynko branding</li></ul></article><article className="pro"><b className="lynko-coming-soon">COMING SOON</b><span>PRO</span><h3>$8 <small>/ month</small></h3><p>For creators ready to understand and grow their audience.</p><Button variant="outline" disabled>Join the waitlist</Button><ul><li>Ã¢Å“â€œÃ£â‚¬â‚¬Advanced customization</li><li>Ã¢Å“â€œÃ£â‚¬â‚¬Full analytics history</li><li>Ã¢Å“â€œÃ£â‚¬â‚¬Custom domain</li><li>Ã¢Å“â€œÃ£â‚¬â‚¬Remove Lynko branding</li></ul></article></div></section>
      <section className="lynko-faq"><div><span>FAQ</span><h2>Things you<br />might be <em>wondering.</em></h2><LynkoMascot size="sm"/></div><div className="lynko-questions">{['Is Lynko really free?','Can I use my own domain?','Can I change my username later?','What does Lynko track?','Can I cancel Pro anytime?'].map((q,i)=><details key={q} open={i===0}><summary>{q}<b>+</b></summary><p>{i===0?'Yes. Create a polished page, add unlimited links, and see your core analyticsÃ¢â‚¬â€no card required.':'Absolutely. Lynko is designed to stay flexible as your online presence evolves.'}</p></details>)}</div></section>
    </main>
    <footer className="lynko-footer"><div><Logo/><h2>Your internet.<br/>Linked your way.</h2><Button asChild className="lynko-lime-button"><Link href="/login">Create your LynkoÃ£â‚¬â‚¬Ã¢â€ â€™</Link></Button></div><div className="lynko-footer-links"><p><b>Product</b><a href="#features">Features</a><a href="#pricing">Pricing</a><Link href="/login">Entrar</Link></p><p><b>Company</b><a href="#footer">About</a><a href="#footer">Privacy</a><a href="#footer">Terms</a></p><p><b>Follow</b><a href="#footer">Instagram</a><a href="#footer">X / Twitter</a><a href="#footer">LinkedIn</a></p></div><LynkoMascot size="sm"/><small id="footer">Ã‚Â© 2025 Lynko, Inc. Made for the wonderfully online.</small></footer>
  </div>
}

export default function Home() { return <HomePage /> }
