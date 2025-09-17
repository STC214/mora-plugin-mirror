import fs from 'node:fs'

export default class moraBase {
  constructor (e = {}) {
    this.e = e
    this.userId = e?.user_id
    this.model = 'Mora'
    this.game = e?.game || 'gs'
  }

  get prefix () {
    return `Mora:${this.model}:`
  }

  checkPlus (path) {
    const exist = fs.existsSync(path)
    if (!exist) this.e.reply('还没下载/更新资源包，该功能用不了捏\n请发送【#更新摩拉资源】以进行更新')
    return exist
  }
}
