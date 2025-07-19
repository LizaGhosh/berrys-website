import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { Suspense } from "react"
import dynamic from "next/dynamic"

const inter = Inter({ subsets: ["latin"] })

// Dynamically import analytics components to avoid chunk loading issues
const GoogleAnalytics = dynamic(() => import("@/components/google-analytics").then((mod) => ({ default: mod.GoogleAnalytics })), {
  ssr: false,
})

const AnalyticsTracker = dynamic(() => import("@/components/analytics-tracker"), {
  ssr: false,
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <Suspense fallback={null}>
            {children}
            <Toaster />
            <GoogleAnalytics />
            <AnalyticsTracker />
          </Suspense>
        </ThemeProvider>
      </body>
    </html>
  )
}

export const metadata = {
      generator: 'v0.dev'
    };
