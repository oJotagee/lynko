import {
  SiFacebook,
  SiFacebookHex,
  SiGithub,
  SiGithubHex,
  SiInstagram,
  SiInstagramHex,
  SiPinterest,
  SiPinterestHex,
  SiSpotify,
  SiSpotifyHex,
  SiTiktok,
  SiTiktokHex,
  SiWhatsapp,
  SiWhatsappHex,
  SiX,
  SiXHex,
  SiYoutube,
  SiYoutubeHex,
} from '@icons-pack/react-simple-icons'

import { LINKEDIN_COLOR, LinkedinIcon } from '../link-icon/linkedin'
import type { SocialPlatform } from './social-link-schema'

export interface SocialPlatformInfo {
  name: string
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' }>
  color: string
  placeholder: string
}

export const socialPlatforms: Record<SocialPlatform, SocialPlatformInfo> = {
  instagram: {
    name: 'Instagram',
    icon: SiInstagram,
    color: SiInstagramHex,
    placeholder: 'https://instagram.com/seu-usuario',
  },
  facebook: {
    name: 'Facebook',
    icon: SiFacebook,
    color: SiFacebookHex,
    placeholder: 'https://facebook.com/sua-pagina',
  },
  tiktok: {
    name: 'TikTok',
    icon: SiTiktok,
    color: SiTiktokHex,
    placeholder: 'https://tiktok.com/@seu-usuario',
  },
  youtube: {
    name: 'YouTube',
    icon: SiYoutube,
    color: SiYoutubeHex,
    placeholder: 'https://youtube.com/@seu-canal',
  },
  linkedin: {
    name: 'LinkedIn',
    icon: LinkedinIcon,
    color: LINKEDIN_COLOR,
    placeholder: 'https://linkedin.com/in/seu-perfil',
  },
  github: {
    name: 'GitHub',
    icon: SiGithub,
    color: SiGithubHex,
    placeholder: 'https://github.com/seu-usuario',
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: SiWhatsapp,
    color: SiWhatsappHex,
    placeholder: '+55 11 91234-5678',
  },
  x: { name: 'X', icon: SiX, color: SiXHex, placeholder: 'https://x.com/seu-usuario' },
  spotify: {
    name: 'Spotify',
    icon: SiSpotify,
    color: SiSpotifyHex,
    placeholder: 'https://open.spotify.com/artist/...',
  },
  pinterest: {
    name: 'Pinterest',
    icon: SiPinterest,
    color: SiPinterestHex,
    placeholder: 'https://pinterest.com/seu-usuario',
  },
}
