const execa = require('execa')

export async function getPassword(site: string): Promise<string> {
    const { stdout } = await execa('security', ['find-generic-password', '-s', site, '-w'])
    return stdout
}
