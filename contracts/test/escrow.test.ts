import { expect } from 'chai'
import { time } from '@nomicfoundation/hardhat-network-helpers'
import { ethers } from 'hardhat'

const Status = {
  CREATED: 0,
  FUNDED: 1,
  SUBMITTED: 2,
  APPROVED: 3,
  RELEASE_AUTHORIZED: 4,
  RELEASED: 5,
  DISPUTED: 6,
  REFUND_AUTHORIZED: 7,
  REFUNDED: 8,
} as const

describe('FreelanceEscrow', () => {
  async function deployFixture() {
    const [operator, client, freelancer, arbitrator, voter1, voter2] = await ethers.getSigners()

    const DisputeDAO = await ethers.getContractFactory('DisputeDAO')
    const disputeDao = await DisputeDAO.deploy(operator.address)
    await disputeDao.waitForDeployment()

    const Factory = await ethers.getContractFactory('EscrowFactory')
    const factory = await Factory.deploy(operator.address)
    await factory.waitForDeployment()

    const milestoneAmounts = [ethers.parseEther('1')]
    const createTx = await factory
      .connect(operator)
      .createEscrow(
        client.address,
        freelancer.address,
        arbitrator.address,
        await disputeDao.getAddress(),
        milestoneAmounts,
      )
    await createTx.wait()

    const escrows = await factory.getEscrows()
    const escrow = await ethers.getContractAt('FreelanceEscrow', escrows[escrows.length - 1])

    return { operator, client, freelancer, arbitrator, voter1, voter2, disputeDao, factory, escrow, milestoneAmounts }
  }

  it('funds, approves, and releases a milestone to freelancer', async () => {
    const { operator, client, freelancer, escrow, milestoneAmounts } = await deployFixture()

    await escrow.connect(client).depositToMilestone(0, { value: milestoneAmounts[0] })
    const [, statusFunded] = await escrow.getMilestone(0)
    expect(Number(statusFunded)).to.equal(Status.FUNDED)

    await escrow.connect(freelancer).submitWork(0, ethers.id('work-hash'))
    await escrow.connect(client).approve(0)
    await escrow.connect(operator).authorizeRelease(0)

    const before = await ethers.provider.getBalance(freelancer.address)
    const releaseTx = await escrow.connect(operator).releaseToFreelancer(0)
    await releaseTx.wait()
    const after = await ethers.provider.getBalance(freelancer.address)

    expect(after - before).to.equal(milestoneAmounts[0])
    const [, statusReleased] = await escrow.getMilestone(0)
    expect(Number(statusReleased)).to.equal(Status.RELEASED)
  })

  it('resolves dispute via DAO vote and refunds client', async () => {
    const { operator, client, freelancer, arbitrator, disputeDao, escrow, milestoneAmounts } = await deployFixture()

    await escrow.connect(client).depositToMilestone(0, { value: milestoneAmounts[0] })
    await escrow.connect(freelancer).submitWork(0, ethers.id('another-hash'))
    await escrow.connect(client).openDispute(0)

    await disputeDao
      .connect(operator)
      .createDispute(escrow.target as string, 0, [client.address, freelancer.address, arbitrator.address], 3600, 0)

    await disputeDao.connect(client).vote(0, 1) // refund
    await disputeDao.connect(arbitrator).vote(0, 1) // refund

    await time.increase(3600)

    const before = await ethers.provider.getBalance(client.address)
    const finalizeTx = await disputeDao.finalize(0)
    await finalizeTx.wait()
    const after = await ethers.provider.getBalance(client.address)

    expect(after - before).to.be.greaterThanOrEqual(milestoneAmounts[0])
    const [, statusFinal] = await escrow.getMilestone(0)
    expect(Number(statusFinal)).to.equal(Status.REFUNDED)
  })
})
