import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BrowserProvider, type Eip1193Provider } from 'ethers'
import toast from 'react-hot-toast'

declare global {
  interface Window {
    ethereum?: Eip1193Provider
  }
}

export type WalletState = {
  address: string | null
  chainId: number | null
  connecting: boolean
  connect: () => Promise<string | null>
  ensureConnected: () => Promise<string | null>
  provider: BrowserProvider | null
}

const WalletContext = createContext<WalletState>({
  address: null,
  chainId: null,
  connecting: false,
  connect: async () => null,
  ensureConnected: async () => null,
  provider: null,
})

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [connecting, setConnecting] = useState(false)
  const providerRef = useRef<BrowserProvider | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('walletAddress')
    if (saved) setAddress(saved)
  }, [])

  const connect = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      toast.error('MetaMask is required to continue')
      return null
    }
    try {
      setConnecting(true)
      const provider = new BrowserProvider(window.ethereum)
      const accounts = await provider.send('eth_requestAccounts', [])
      const network = await provider.getNetwork()
      const addr = accounts?.[0] ?? null
      if (addr) {
        providerRef.current = provider
        setAddress(addr)
        setChainId(Number(network.chainId))
        localStorage.setItem('walletAddress', addr)
        toast.success('Wallet connected')
      }
      return addr ?? null
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet'
      toast.error(message)
      return null
    } finally {
      setConnecting(false)
    }
  }, [])

  const ensureConnected = useCallback(async () => {
    if (address) return address
    return connect()
  }, [address, connect])

  const value = useMemo(
    () => ({ address, chainId, connecting, connect, ensureConnected, provider: providerRef.current }),
    [address, chainId, connecting, connect, ensureConnected],
  )

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWallet() {
  return useContext(WalletContext)
}
