import { createApp } from './app'
import { connectMongo } from './config/mongo'
import { env } from './config/env'

async function main() {
  await connectMongo()
  const app = createApp()

  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.PORT}`)
  })
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

