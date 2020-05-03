const execa = require('execa')

// getPassword looks in the MacOS keychain for a password for the given site
export async function getPassword(site: string): Promise<string> {
    const { stdout } = await execa('security', ['find-generic-password', '-s', site, '-w'])
    return stdout
}

// Simple barrier implementation for syncing up parallel threads
export class Barrier {
    static readonly timeout = 1000;

    constructor(
        private i = 0
    ) { }

    wait(): Promise<void> {
        this.i--
        const that = this
        return new Promise((resolve) => {
            (function waitInner() {
                if (that.i <= 0) return resolve()
                setTimeout(waitInner, Barrier.timeout)
            })()
        })
    }
}
