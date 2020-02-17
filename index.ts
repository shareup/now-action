import { getInput, setOutput, setFailed } from '@actions/core'
import { exec } from '@actions/exec'
import { parse } from 'dotenv'

const debug = isTrue(getInput('debug'))
const token = getInput('token', { required: true })

const name = input('name')
const scope = input('scope')
const regions = input('regions')
const prod = isTrue(input('prod'))
const force = isTrue(input('force'))
const shouldBePublic = isTrue(input('public'))
const env = input('env')
const buildENV = input('build_env')
const meta = input('meta')
const path = input('path')

;(async () => {
  try {
    const deploymentURL = await deploy()
    const inspectOutput = await inspect(deploymentURL)
    const deploymentID = extractID(inspectOutput)

    output('deployment_id', deploymentID)
    output('deployment_url', deploymentURL)
  } catch (e) {
    setFailed(`error: ${e.stack}`)
  }
})()

const extractErrorMessage = 'Could not find deployment ID in inspect output'

function extractID (output: string): string {
  const dplLine = output.split('\n').filter(line => {
    return line.match(/dpl_/)
  })

  if (dplLine.length !== 1) {
    console.error("Didn't fine a line with dpl_")
    throw new Error(extractErrorMessage)
  }

  const line = dplLine[0].trim()

  const parts = line.split('\t')

  if (parts.length < 2) {
    console.debug("Didn't find multiple parts from the dpl_ line", parts)
    throw new Error(extractErrorMessage)
  }

  const id = parts[parts.length - 1]

  return id
}

async function inspect (url: string): Promise<string> {
  const args: string[] = []

  // NOTE: MUST BE FIRST!
  args.push('inspect')

  args.push(`--token=${token}`)

  if (scope) {
    args.push(`--scope=${scope}`)
  }

  // NOTE: We cannot send --debug because the debug output is mixed with the inspect output

  // NOTE: MUST BE LAST!
  args.push(url)

  return now(args, 'stderr')
}

async function deploy (): Promise<string> {
  const args: string[] = []

  args.push(`--token=${token}`)
  args.push('--no-clipboard')
  args.push('--confirm')

  if (name) {
    args.push(`--name=${name}`)
  }

  if (scope) {
    args.push(`--scope=${scope}`)
  }

  if (regions) {
    args.push(`--regions=${regions}`)
  }

  if (prod) {
    args.push('--prod')
  }

  if (force) {
    args.push('--force')
  }

  if (shouldBePublic) {
    args.push('--public')
  }

  if (env) {
    const parsedENV: { [key: string]: string } = parse(env)

    Object.keys(parsedENV).forEach(key => {
      args.push('-e', `${key}=${parsedENV[key]}`)
    })
  }

  if (buildENV) {
    const parsedBuildENV: { [key: string]: string} = parse(buildENV)

    Object.keys(parsedBuildENV).forEach(key => {
      args.push('-b', `${key}=${parsedBuildENV[key]}`)
    })
  }

  if (meta) {
    const parsedMeta: { [key: string]: string} = parse(meta)

    Object.keys(parsedMeta).forEach(key => {
      args.push('-m', `${key}=${parsedMeta[key]}`)
    })
  }

  if (debug) {
    args.push('--debug')
  }

  // NOTE: MUST BE LAST!
  if (path) {
    args.push(path)
  }

  return now(args)
}

async function now (args: string[], listenerType: string = 'stdout'): Promise<string> {
  if (debug) {
    console.debug('command', 'now', args)
  }

  let buffer = ''

  const listeners = {}
  listeners[listenerType] = (data: string) => {
    buffer += data.toString()
  }

  await exec('now', args, { listeners })

  return buffer.trim()
}

function input (name: string, defaultValue?: string): string | null {
  let value = getInput(name)

  if (!value || value === '') {
    value = defaultValue
  }

  if (debug) {
    console.debug('got input', name, value)
  }

  return value
}

function output (name: string, value: string) {
  if (debug) {
    console.debug('outputting', name, value)
  }

  setOutput(name, value)
}

function isTrue (value: boolean | string): boolean {
  return value === true || value === 'true'
}
