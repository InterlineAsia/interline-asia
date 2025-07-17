import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect to the static homepage
  redirect('/index.html')
}