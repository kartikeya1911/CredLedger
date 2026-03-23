import { BrowserProvider, Contract } from 'ethers'
import toast from 'react-hot-toast'
import { freelanceEscrowAbi } from '../abi/freelanceEscrow'
import { escrowFactoryAbi } from '../abi/escrowFactory'
import { useWallet } from '../context/wallet'

const FACTORY_ADDRESS = import.meta.env.VITE_ESCROW_FACTORY_ADDRESS

function getEthereum(): typeof window.ethereum {
  if (typeof window === 'undefined') throw new Error('No window')
  return (window as any).ethereum
}

export function useContract() {
  const { ensureConnected } = useWallet()

  async function requireSigner() {
    await ensureConnected()
    const eth = getEthereum()
    if (!eth) {
      toast.error('MetaMask is required')
      throw new Error('METAMASK_MISSING')
    }
    const provider = new BrowserProvider(eth)
    return provider.getSigner()
  }

  async function getEscrowContract(address: string) {
    if (!address) throw new Error('Missing contract address')
    const signer = await requireSigner()
    return new Contract(address, freelanceEscrowAbi, signer)
  }

  async function getFactoryContract() {
    if (!FACTORY_ADDRESS) {
      toast.error('Factory address not configured')
      throw new Error('FACTORY_ADDRESS_MISSING')
    }
    const signer = await requireSigner()
    return new Contract(FACTORY_ADDRESS, escrowFactoryAbi, signer)
  }

  return { getEscrowContract, getFactoryContract }
}
