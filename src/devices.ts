import { Page } from "puppeteer-core"

export interface Device {
    name: string
    domain: string
    page: Page

    login(password: string): Promise<boolean>
    logout(): Promise<boolean>
    reboot(confirm: boolean): Promise<boolean>
}

export class TPLinkExtender implements Device {
    name = 'TPLink Powerline Extender'
    domain = 'wifi.powerline'
    page: Page

    async login(password: string): Promise<boolean> {
        const url = `http://${this.domain}/`
        try {
            await this.page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 5000,
            })
        } catch {
            throw new Error(`Failed to load "${url}"`)
        }

        await this.page.focus('#pcPassword')
        await this.page.keyboard.type(password)
        await this.page.click('#loginBtn')
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' })

        return true
    }

    async logout(): Promise<boolean> {
        await this.page.click('#top-control-logout')
        await new Promise(r => setTimeout(r, 1000)) // wait for dialog
        await this.page.click('#logout_confirm_msg .btn-msg-ok')
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' })
        return true
    }

    async reboot(confirm: boolean): Promise<boolean> {
        await this.page.click('#top-control-reboot')
        await new Promise(r => setTimeout(r, 1000)) // wait for dialog

        if (confirm) {
            await this.page.click('#reboot_confirm_msg .btn-msg-ok')
            await this.page.waitForSelector('#reboot_confirm_msg #reboot_progressbar_text')
            return true
        }

        await this.page.click('#reboot_confirm_msg .btn-msg-no')
        await new Promise(r => setTimeout(r, 1000)) // wait for dialog
        return false
    }
}

class Ziggo {
    domain: string
    page: Page

    async login(password: string): Promise<boolean> {
        const url = `http://${this.domain}/common_page/login.html`
        try {
            await this.page.goto(url, {
                waitUntil: 'networkidle0',
                timeout: 5000,
            })
        } catch {
            throw new Error(`Failed to load "${url}"`)
        }

        await this.page.focus('#loginPassword')
        await this.page.keyboard.type(password)
        await this.page.click('[name="id_common_login"]')
        await this.page.waitForNavigation({ waitUntil: 'networkidle0' })
        return true
    }

    async logout(): Promise<boolean> {
        await this.page.click('#c_mu30')
        await new Promise(r => setTimeout(r, 1000))
        return true
    }

    async reboot(confirm: boolean): Promise<boolean> {
        await this.page.click('#c_mu25') // nav > admin
        await this.page.click('#c_mu27') // nav > reset and reboot
        await (await this.page.waitForSelector('#c_rr14')).click() // reboot

        const confirmBtn = await this.page.waitForSelector('#noticecontent #c_st28')
        if (confirm) {
            await confirmBtn.click() // confirm
            await this.page.waitForSelector('#wait-massage')
            return true
        }

        return false
    }
}

export class ZiggoRouter extends Ziggo implements Device {
    name = 'Ziggo Router'
    domain = 'wifi.router'
}

export class ZiggoBooster extends Ziggo implements Device {
    name = 'Ziggo Booster'
    domain = 'wifi.booster'
}
