import {
  SiBehance,
  SiBehanceHex,
  SiBluesky,
  SiBlueskyHex,
  SiDiscord,
  SiDiscordHex,
  SiDribbble,
  SiDribbbleHex,
  SiFacebook,
  SiFacebookHex,
  SiFigma,
  SiFigmaHex,
  SiGithub,
  SiGithubHex,
  SiGitlab,
  SiGitlabHex,
  SiInstagram,
  SiInstagramHex,
  SiKofi,
  SiKofiHex,
  SiMedium,
  SiMediumHex,
  SiNotion,
  SiNotionHex,
  SiPatreon,
  SiPatreonHex,
  SiPinterest,
  SiPinterestHex,
  SiReddit,
  SiRedditHex,
  SiSoundcloud,
  SiSoundcloudHex,
  SiSpotify,
  SiSpotifyHex,
  SiSubstack,
  SiSubstackHex,
  SiTelegram,
  SiTelegramHex,
  SiThreads,
  SiThreadsHex,
  SiTiktok,
  SiTiktokHex,
  SiTwitch,
  SiTwitchHex,
  SiWhatsapp,
  SiWhatsappHex,
  SiX,
  SiXHex,
  SiYoutube,
  SiYoutubeHex,
} from '@icons-pack/react-simple-icons'

import { LINKEDIN_COLOR, LinkedinIcon } from './linkedin-icon'

export interface LinkBrand {
  name: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  color: string
}

// shortcut: só as marcas mais comuns em páginas de links; amplie a lista quando surgir demanda.
const brands: (LinkBrand & { domains: string[] })[] = [
  { name: 'YouTube', icon: SiYoutube, color: SiYoutubeHex, domains: ['youtube.com', 'youtu.be'] },
  {
    name: 'LinkedIn',
    icon: LinkedinIcon,
    color: LINKEDIN_COLOR,
    domains: ['linkedin.com', 'lnkd.in'],
  },
  { name: 'GitHub', icon: SiGithub, color: SiGithubHex, domains: ['github.com'] },
  { name: 'GitLab', icon: SiGitlab, color: SiGitlabHex, domains: ['gitlab.com'] },
  { name: 'Instagram', icon: SiInstagram, color: SiInstagramHex, domains: ['instagram.com'] },
  { name: 'X', icon: SiX, color: SiXHex, domains: ['x.com', 'twitter.com'] },
  { name: 'TikTok', icon: SiTiktok, color: SiTiktokHex, domains: ['tiktok.com'] },
  { name: 'Facebook', icon: SiFacebook, color: SiFacebookHex, domains: ['facebook.com', 'fb.com'] },
  { name: 'Twitch', icon: SiTwitch, color: SiTwitchHex, domains: ['twitch.tv'] },
  { name: 'Discord', icon: SiDiscord, color: SiDiscordHex, domains: ['discord.com', 'discord.gg'] },
  { name: 'Spotify', icon: SiSpotify, color: SiSpotifyHex, domains: ['spotify.com'] },
  { name: 'WhatsApp', icon: SiWhatsapp, color: SiWhatsappHex, domains: ['whatsapp.com', 'wa.me'] },
  { name: 'Telegram', icon: SiTelegram, color: SiTelegramHex, domains: ['telegram.org', 't.me'] },
  { name: 'Behance', icon: SiBehance, color: SiBehanceHex, domains: ['behance.net'] },
  { name: 'Dribbble', icon: SiDribbble, color: SiDribbbleHex, domains: ['dribbble.com'] },
  { name: 'Figma', icon: SiFigma, color: SiFigmaHex, domains: ['figma.com'] },
  { name: 'Medium', icon: SiMedium, color: SiMediumHex, domains: ['medium.com'] },
  { name: 'Substack', icon: SiSubstack, color: SiSubstackHex, domains: ['substack.com'] },
  { name: 'Pinterest', icon: SiPinterest, color: SiPinterestHex, domains: ['pinterest.com'] },
  { name: 'Reddit', icon: SiReddit, color: SiRedditHex, domains: ['reddit.com'] },
  {
    name: 'Threads',
    icon: SiThreads,
    color: SiThreadsHex,
    domains: ['threads.net', 'threads.com'],
  },
  { name: 'Bluesky', icon: SiBluesky, color: SiBlueskyHex, domains: ['bsky.app'] },
  { name: 'SoundCloud', icon: SiSoundcloud, color: SiSoundcloudHex, domains: ['soundcloud.com'] },
  { name: 'Patreon', icon: SiPatreon, color: SiPatreonHex, domains: ['patreon.com'] },
  { name: 'Ko-fi', icon: SiKofi, color: SiKofiHex, domains: ['ko-fi.com'] },
  { name: 'Notion', icon: SiNotion, color: SiNotionHex, domains: ['notion.so', 'notion.site'] },
]

export function getLinkBrand(url: string): LinkBrand | null {
  let host: string

  try {
    host = new URL(url).hostname.toLowerCase()
  } catch {
    return null
  }

  const brand = brands.find(({ domains }) =>
    domains.some((domain) => host === domain || host.endsWith(`.${domain}`)),
  )

  return brand ? { name: brand.name, icon: brand.icon, color: brand.color } : null
}
