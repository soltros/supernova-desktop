import { Capacitor } from '@capacitor/core'
import { useIsMobile } from '@/app/hooks/use-mobile'
import { AppTitle } from '@/app/components/header/app-title'
import { LoginForm } from '@/app/components/login/form'

export default function Login() {
  const narrow = useIsMobile()
  const mobile = narrow || Capacitor.isNativePlatform()

  return (
    <div className="flex min-h-dvh flex-col [padding-top:env(safe-area-inset-top)]">
      <header className="w-full flex items-center justify-center h-header shrink-0 px-4 bg-background border-b electron-drag">
        <AppTitle mobile={mobile} />
      </header>
      <main className="flex flex-1 flex-col items-center justify-center p-4">
        <LoginForm />
      </main>
    </div>
  )
}
