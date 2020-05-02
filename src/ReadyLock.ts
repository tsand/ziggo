
// ReadyLock allows multiple parallel operations to wait until they are all ready to continue
export class ReadyLock {
    ready: boolean[]

    constructor() {
        this.ready = []
    }

    start(): number {
        return this.ready.push(false) - 1
    }

    wait(i: number) {
        this.ready[i] = true

        var that = this
        return new Promise(function (resolve, reject) {
            (function waitInner() {
                if (that.isReady()) return resolve()
                setTimeout(waitInner, 1000)
            })()
        })
    }

    private isReady(): boolean {
        return this.ready.every(v => v === true)
    }
}
