import { redirect } from 'next/navigation'

export default function LoginPage() {
  // Redirect to the static login page
  redirect('/login.html')
}