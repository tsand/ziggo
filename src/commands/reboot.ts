import { runTask } from '../tasks'

export const command = 'reboot'
export const describe = 'Power cycle the routers'

export const builder = {
    dryRun: {
        alias: 'd',
        describe: 'Run command but stop before any changes are made',
        type: 'boolean',
        default: false,
    },
    headless: {
        alias: 'h',
        describe: 'Whether to run the browser in headless mode',
        type: 'boolean',
        default: true,
    },
}

export const handler = (argv) => {
    const { dryRun, headless } = argv
    runTask('RebootTask', dryRun, headless)
}
