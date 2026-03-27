import { Contract, Interface, JsonRpcProvider, Wallet, type Log } from 'ethers'
import { env } from '../config/env'
// Import ABI locally to avoid runtime path issues
import escrowArtifact from '../../../contracts/artifacts/contracts/FreelanceEscrow.sol/FreelanceEscrow.json'
import factoryArtifact from '../../../contracts/artifacts/contracts/EscrowFactory.sol/EscrowFactory.json'

export type ExpectedEvent = 'MilestoneFunded' | 'MilestoneReleased' | 'MilestoneRefunded' | 'DisputeOpened'

const provider = new JsonRpcProvider(env.SEPOLIA_RPC_URL)
const iface = new Interface(escrowArtifact.abi)
const factoryIface = new Interface(factoryArtifact.abi)

/* ─── Operator wallet for on-chain calls that require onlyOperator ─── */

function getOperatorWallet() {
  if (!env.OPERATOR_PRIVATE_KEY) throw new Error('OPERATOR_PRIVATE_KEY not configured')
  if (!env.SEPOLIA_RPC_URL) throw new Error('SEPOLIA_RPC_URL not configured')
  return new Wallet(env.OPERATOR_PRIVATE_KEY, provider)
}

function getEscrowContract(escrowAddress: string) {
  const wallet = getOperatorWallet()
  return new Contract(escrowAddress, escrowArtifact.abi, wallet)
}

/**
 * Server-side release: authorizeRelease (if needed) → releaseToFreelancer
 * Both are onlyOperator in the contract.
 */
export async function operatorRelease(escrowAddress: string, milestoneIndex: number) {
  const contract = getEscrowContract(escrowAddress)

  // Read current on-chain status
  const [, statusNum] = await contract.getMilestone(milestoneIndex)
  const status = Number(statusNum)
  // Status enum: CREATED=0, FUNDED=1, SUBMITTED=2, APPROVED=3, RELEASE_AUTHORIZED=4, RELEASED=5, DISPUTED=6, REFUND_AUTHORIZED=7, REFUNDED=8

  if (status === 5) throw new Error('ALREADY_RELEASED')
  if (status === 8) throw new Error('ALREADY_REFUNDED')

  // Release: skip authorize if already authorized
  if (status !== 4) {
    // Optionally authorize if needed by the specific contract version deployed
    try {
      const authTx = await contract.authorizeRelease(milestoneIndex)
      await authTx.wait()
    } catch {
      // Ignore if contract doesn't need authorization
    }
  }

  const tx = await contract.releaseToFreelancer(milestoneIndex)
  const receipt = await tx.wait()
  const network = await provider.getNetwork()
  return {
    txHash: tx.hash,
    chainId: Number(network.chainId),
    confirmations: receipt?.confirmations ?? 1,
  }
}

/**
 * Server-side refund: authorizeRefund (if needed) → refundClient
 * Both are onlyOperator in the contract.
 */
export async function operatorRefund(escrowAddress: string, milestoneIndex: number) {
  const contract = getEscrowContract(escrowAddress)

  // Read current on-chain status
  const [, statusNum] = await contract.getMilestone(milestoneIndex)
  const status = Number(statusNum)

  if (status === 8) throw new Error('ALREADY_REFUNDED')
  if (status === 5) throw new Error('ALREADY_RELEASED')

  // Refund: skip authorize if already authorized
  if (status !== 7) {
    try {
      const authTx = await contract.authorizeRefund(milestoneIndex)
      await authTx.wait()
    } catch {
      // Ignore
    }
  }

  const tx = await contract.refundClient(milestoneIndex)
  const receipt = await tx.wait()
  const network = await provider.getNetwork()
  return {
    txHash: tx.hash,
    chainId: Number(network.chainId),
    confirmations: receipt?.confirmations ?? 1,
  }
}

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
  const statusOk = receipt.status === 1
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
  factoryAddress?: string
}) {
  const factoryAddress = params.factoryAddress ?? env.ESCROW_FACTORY_ADDRESS
  if (!factoryAddress) throw new Error('ESCROW_FACTORY_ADDRESS not configured')
  const receipt = await provider.getTransactionReceipt(params.txHash)
  if (!receipt) throw new Error('TX_NOT_FOUND')
  const statusOk = receipt.status === 1
  if (!statusOk) throw new Error('TX_FAILED')
  if (!addressesEqual(receipt.to, factoryAddress)) throw new Error('TX_TO_MISMATCH')

  const parsed = findFactoryEvent(receipt.logs, factoryAddress)
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
