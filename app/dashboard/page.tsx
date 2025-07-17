import { redirect } from 'next/navigation'

export default function DashboardPage() {
  // Redirect to the static dashboard page
  redirect('/dashboard.html')
}