import { redirect } from 'next/navigation'

export default function VerifyPage() {
  // Redirect to the static verify page
  redirect('/verify.html')
}