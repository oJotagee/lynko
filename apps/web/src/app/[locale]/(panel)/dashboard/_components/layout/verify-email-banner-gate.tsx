import { getDashboard } from '../../_data-access/get-dashboard'
import { VerifyEmailBanner } from './verify-email-banner'

export async function VerifyEmailBannerGate() {
  try {
    const { user } = await getDashboard()

    return user.emailVerified ? null : <VerifyEmailBanner email={user.email} />
  } catch {
    return null
  }
}
