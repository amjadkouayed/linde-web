import { redirect } from 'next/navigation'

export default function Home() {
  redirect('/login?next=%2Fonboarding')
}
