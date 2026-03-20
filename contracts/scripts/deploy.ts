import 'dotenv/config'
import { ethers } from 'hardhat'

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log('Deployer:', deployer.address)

  const operator = deployer.address
  const DisputeDAO = await ethers.getContractFactory('DisputeDAO')
  const disputeDao = await DisputeDAO.deploy(operator)
  await disputeDao.waitForDeployment()
  console.log('DisputeDAO deployed to:', await disputeDao.getAddress())

  const Factory = await ethers.getContractFactory('EscrowFactory')
  const factory = await Factory.deploy(operator)
  await factory.waitForDeployment()

  const addr = await factory.getAddress()
  console.log('EscrowFactory deployed to:', addr)

  // Example: create a new escrow instance (update addresses + milestone amounts as needed)
  // const createTx = await factory.createEscrow(
  //   clientAddress,
  //   freelancerAddress,
  //   arbitratorAddress,
  //   await disputeDao.getAddress(),
  //   [ethers.parseEther('0.5'), ethers.parseEther('1')]
  // )
  // await createTx.wait()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

