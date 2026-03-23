import { Interface, JsonRpcProvider, type Log } from 'ethers'
import { env } from '../config/env'
// Import ABI locally to avoid runtime path issues
import escrowArtifact from '../../../contracts/artifacts/contracts/FreelanceEscrow.sol/FreelanceEscrow.json'
import factoryArtifact from '../../../contracts/artifacts/contracts/EscrowFactory.sol/EscrowFactory.json'

export type ExpectedEvent = 'MilestoneFunded' | 'MilestoneReleased' | 'MilestoneRefunded' | 'DisputeOpened'

const provider = new JsonRpcProvider(env.SEPOLIA_RPC_URL)
const iface = new Interface(escrowArtifact.abi)
const factoryIface = new Interface(factoryArtifact.abi)

function addressesEqual(a?: string | null, b?: string | null) {
  return (a ?? '').toLowerCase() === (b ?? '').toLowerCase()
}

export async function verifyEscrowTransaction(params: {
  txHash: string
  contractAddress: string
  expectedEvent: ExpectedEvent
  milestoneId: number
  amountWei?: bigint
  fromAddress?: string | null
}) {
  if (!env.SEPOLIA_RPC_URL) {
    throw new Error('SEPOLIA_RPC_URL not configured')
  }

  const receipt = await provider.getTransactionReceipt(params.txHash)
  if (!receipt) throw new Error('TX_NOT_FOUND')
  const statusOk = receipt.status === 1 || receipt.status === 1n
  if (!statusOk) throw new Error('TX_FAILED')
  if (!addressesEqual(receipt.to, params.contractAddress)) throw new Error('TX_TO_MISMATCH')

  const parsedLog = findEvent(receipt.logs, params.contractAddress, params.expectedEvent)
  if (!parsedLog) throw new Error('EVENT_NOT_FOUND')

  const milestoneIdFromEvent = parsedLog.args?.[0]
  if (params.milestoneId !== Number(milestoneIdFromEvent)) throw new Error('MILESTONE_MISMATCH')

  const amountFromEvent = parsedLog.args?.[1]
  if (params.amountWei && amountFromEvent != null && BigInt(amountFromEvent) !== params.amountWei) {
    throw new Error('AMOUNT_MISMATCH')
  }

  if (params.fromAddress && receipt.from && !addressesEqual(receipt.from, params.fromAddress)) {
    throw new Error('SENDER_MISMATCH')
  }

  const network = await provider.getNetwork()
  const confirmations = receipt.confirmations ?? Math.max((await provider.getBlockNumber()) - receipt.blockNumber + 1, 1)

  return { receipt, chainId: Number(network.chainId), confirmations }
}

export async function verifyFactoryCreation(params: {
  txHash: string
  expectedEscrow: string
}) {
  if (!env.ESCROW_FACTORY_ADDRESS) throw new Error('ESCROW_FACTORY_ADDRESS not configured')
  const receipt = await provider.getTransactionReceipt(params.txHash)
  if (!receipt) throw new Error('TX_NOT_FOUND')
  const statusOk = receipt.status === 1 || receipt.status === 1n
  if (!statusOk) throw new Error('TX_FAILED')
  if (!addressesEqual(receipt.to, env.ESCROW_FACTORY_ADDRESS)) throw new Error('TX_TO_MISMATCH')

  const parsed = findFactoryEvent(receipt.logs, env.ESCROW_FACTORY_ADDRESS)
  if (!parsed) throw new Error('EVENT_NOT_FOUND')
  const escrowAddress = parsed.args?.escrow ?? parsed.args?.[0]
  if (!addressesEqual(escrowAddress, params.expectedEscrow)) throw new Error('ESCROW_ADDRESS_MISMATCH')

  const network = await provider.getNetwork()
  const confirmations = receipt.confirmations ?? Math.max((await provider.getBlockNumber()) - receipt.blockNumber + 1, 1)

  return { receipt, chainId: Number(network.chainId), confirmations }
}

function findEvent(logs: readonly Log[], contractAddress: string, eventName: ExpectedEvent) {
  for (const log of logs) {
    if (!addressesEqual(log.address, contractAddress)) continue
    try {
      const parsed = iface.parseLog(log)
      if (parsed?.name === eventName) return parsed
    } catch (err) {
      // ignore non-matching logs
    }
  }
  return null
}

function findFactoryEvent(logs: readonly Log[], contractAddress: string) {
  for (const log of logs) {
    if (!addressesEqual(log.address, contractAddress)) continue
    try {
      const parsed = factoryIface.parseLog(log)
      if (parsed?.name === 'EscrowCreated') return parsed
    } catch (err) {
      // ignore
    }
  }
  return null
}

export function getRpcProvider() {
  return provider
}

export { iface as escrowInterface, factoryIface as escrowFactoryInterface }
