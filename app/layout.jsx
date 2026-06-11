import './globals.css'

export const metadata = {
  title: 'Sales Leaderboard - Ironbridge',
  description: 'Team sales performance tracking',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
