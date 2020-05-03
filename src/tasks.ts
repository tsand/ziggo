import { Device, TPLinkExtender, ZiggoRouter, ZiggoBooster } from './devices'
import { launch, Browser } from 'puppeteer-core'
import { getPassword, Barrier } from './utils'
import Listr = require('listr')


interface Task {
    setUp(): Promise<void>
    run(): Promise<void>
    tearDown(): Promise<void>
}


class RebootTask {

    private listr: Listr
    private barrier: Barrier
    private browser: Browser

    constructor(
        private devices: Array<Device>,
        private dryRun = false,
        private headless = true) {
        this.barrier = new Barrier(this.devices.length)

        this.listr = new Listr({
            concurrent: true,
        })
        this.devices.forEach((d) => this.addDeviceTask(d))
    }

    async setUp() {
        this.browser = await launch({
            executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            headless: this.headless,
            defaultViewport: null,
        })
    }

    async tearDown() {
        await this.browser.close()
    }

    async run() {
        await this.listr.run()
    }

    private addDeviceTask(device: Device) {
        this.listr.add([{
            title: device.name,
            task: (_, lTask) => this.runOnDevice(lTask, device)
        }])
    }

    private async runOnDevice(lTask, device: Device) {
        lTask.output = 'Retrieving password...'
        const password = await getPassword(device.domain)

        lTask.output = 'Opening tab...'
        const page = await this.browser.newPage()
        device.page = page

        lTask.output = 'Logging in...'
        await device.login(password)

        lTask.output = 'Waiting on other devices...'
        await this.barrier.wait()

        lTask.output = 'Rebooting...'
        const rebooted = await device.reboot(!this.dryRun)
        if (!rebooted) {
            lTask.output = 'Logging out...'
            await device.logout()
        }
    }
}

export async function runTask(taskName: string, dryRun = false, headless = true, name: string): Promise<void> {
    let task: Task

    let devices = [
        new TPLinkExtender(),
        new ZiggoBooster(),
        new ZiggoRouter(),
    ].filter((d) => name == null || d.name.toUpperCase().match(name.toUpperCase()) != null)

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
