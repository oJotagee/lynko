'use client'

import { createContext, useContext, useState } from 'react'

const PasswordVisibilityContext = createContext({
  visible: false,
  setVisible: (_visible: boolean) => {},
})

export function PasswordVisibilityProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false)

  return (
    <PasswordVisibilityContext.Provider value={{ visible, setVisible }}>
      {children}
    </PasswordVisibilityContext.Provider>
  )
}

export function usePasswordVisibility() {
  return useContext(PasswordVisibilityContext)
}
