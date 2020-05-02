import { Device, TPLinkExtender, ZiggoRouter, ZiggoBooster } from './devices'
import { getPassword } from './keychain'
import { launch, Browser } from 'puppeteer-core'
import { ReadyLock } from './ReadyLock'
import Listr = require('listr')


interface Task {
    setUp(): Promise<void>
    run(): Promise<void>
    tearDown(): Promise<void>
}


class RebootTask {
    listr: Listr
    readyLock: ReadyLock
    browser: Browser
    devices: Array<Device>

    dryRun: boolean
    headless: boolean

    constructor(devices: Array<Device>, dryRun = false, headless = true) {
        this.devices = devices
        this.dryRun = dryRun
        this.headless = headless
        this.readyLock = new ReadyLock()
    }

    async setUp() {
        this.browser = await launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: this.headless,
            defaultViewport: null,
        })

        this.listr = new Listr({
            concurrent: true
        })

        for (let device of this.devices) {
            this.listr.add([{
                title: device.name,
                task: (_, lTask) => this.runOnDevice(lTask, device)
            }])
        }
    }

    async tearDown() {
        await this.browser.close()
    }

    async run() {
        await this.listr.run()
    }

    private async runOnDevice(lTask, device: Device) {
        const lid = this.readyLock.start()

        lTask.output = 'Retrieving password...'
        const password = await getPassword(device.domain)

        lTask.output = 'Opening tab...'
        const page = await this.browser.newPage()
        device.page = page

        lTask.output = 'Logging in...'
        await device.login(password)

        lTask.output = 'Waiting on other devices...'
        await this.readyLock.wait(lid)

        lTask.output = 'Rebooting...'
        const rebooted = await device.reboot(!this.dryRun)
        if (!rebooted) {
            lTask.output = 'Logging out...'
            await device.logout()
        }
    }
}

export async function runTask(taskName: string, dryRun = false, headless = true): Promise<void> {
    let task: Task

    const devices = [
        new TPLinkExtender(),
        new ZiggoBooster(),
        new ZiggoRouter(),
    ]

    switch (taskName) {
        case RebootTask.name:
            task = new RebootTask(devices, dryRun, headless)
            break
        default:
            throw new Error(`Unknown task: "${taskName}"`)
    }

    await task.setUp()
    try {
        await task.run()
    } finally {
        await task.tearDown()
    }
}
