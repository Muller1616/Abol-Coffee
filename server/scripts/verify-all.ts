import { spawn } from 'node:child_process'

const scripts = [
  'verify:auth',
  'verify:restaurant',
  'verify:categories',
  'verify:menu-items',
  'verify:uploads',
  'verify:public-menu',
  'verify:dashboard',
  'verify:qr',
] as const

function run(script: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('npm', ['run', script], {
      cwd: process.cwd(),
      stdio: 'inherit',
    })

    child.on('exit', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`${script} failed with exit code ${code ?? 'unknown'}`))
    })
  })
}

async function main() {
  for (const script of scripts) {
    console.log(`\n=== Running ${script} ===\n`)
    await run(script)
  }

  console.log('\nALL_VERIFICATIONS_PASSED\n')
}

main().catch((error: unknown) => {
  console.error('\nALL_VERIFICATIONS_FAILED')
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
