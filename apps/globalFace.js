import plugin from '../../../lib/plugins/plugin.js'
import fs from 'node:fs'
import _ from 'lodash'
import common from '../../../lib/common/common.js'
import { yzInfo } from '../components/index.js'

let textArr = {}
/**
 * Original from 云崽表情功能
 * Modify by Rrrrrrray
 * 全局表情添加删除操作仅主人能用
 * 覆盖原表情列表功能：
 *  #表情列表 全局表情和本群表情合并显示
 *  #全局表情 照旧
 * * 如不需要此功能在云崽设置里禁用
 */
export class globalFace extends plugin {
  constructor () {
    super({
      name: '全局表情',
      dsc: '全局表情限制',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#(全局)?(添加|删除)(.*)',
          fnc: 'globalFace'
        }, {
          reg: '#(全局)?(表情|词条)(.*)',
          fnc: 'listMeme'
        }
      ]
    })
    this.path = './data/textJson/'
    this.facePath = './data/face/'
    this.isGlobal = false
  }

  async globalFace () {
    this.isGlobal = this.e?.msg.includes('全局')

    if (this.e?.isMaster || !this.isGlobal) return false
    else {
      this.e.reply('暂无权限，只有主人才能操作')
      return true
    }
  }

  async listMeme () {
    if (this.e.msg.includes('全局')) {
      this.e.msg = this.e.msg.replace(/表情|词条/, '词条')
      return false
    }

    if (yzInfo.isTRSS) {
      this.path = './data/messageJson/'
      this.facePath = this.path
    }

    let page = 1
    let pageSize = 100
    let type = 'list'

    await this.getGroupId()
    if (!this.group_id) return false

    this.textArr()
    this.globalTextArr()

    let search = this.e.msg.replace(/#|＃|表情|词条/g, '')

    if (search.includes('列表')) page = search.replace(/列表/g, '') || 1
    else type = 'search'

    let list = new Map([...textArr[this.global_id], ...textArr[this.group_id]])

    if (_.isEmpty(list)) {
      await this.e.reply('暂无表情')
      return
    }

    let arr = []
    for (let [k, v] of list) {
      if (type == 'list') arr.push({ key: k, val: v, num: arr.length + 1 })
      else if (k.includes(search)) arr.push({ key: k, val: v, num: arr.length + 1 }) /** 搜索表情 */
    }

    let count = arr.length
    arr = arr.reverse()

    if (type == 'list') arr = this.pagination(page, pageSize, arr)

    if (_.isEmpty(arr)) return

    let msg = []
    let num = 0
    for (let i in arr) {
      if (num >= page * pageSize) break

      let keyWord = await this.keyWordTran(arr[i].key)
      if (!keyWord) continue

      if (Array.isArray(keyWord)) {
        keyWord.unshift(`${arr[i].num}、`)
        keyWord.push('\n')
        keyWord.forEach(v => msg.push(v))
      } else if (keyWord.type) msg.push(`\n${arr[i].num}、`, keyWord, '\n\n')
      else msg.push(`${arr[i].num}、${keyWord}\n`)

      num++
    }

    if (type == 'list' && count > 100) msg.push(`更多内容请翻页查看\n如：#表情列表${Number(page) + 1}`)

    let title = `表情列表，第${page}页，共${count}条`
    if (type == 'search') title = `表情${search}，${count}条`

    this.e.reply(await common.makeForwardMsg(this.e, _.chunk(msg, 10), title))
  }

  /** 群号key */
  get grpKey () {
    return `Yz:group_id:${this.e.user_id}`
  }

  /** 获取群号 */
  async getGroupId () {
    if (this.e.isGroup) {
      this.group_id = this.e.group_id
      redis.setEx(this.grpKey, 3600 * 24 * 30, String(this.group_id))
      return this.group_id
    }

    // redis获取
    let groupId = await redis.get(this.grpKey)
    if (groupId) {
      this.group_id = groupId
      return this.group_id
    }

    return false
  }

  /** 获取已添加内容 */
  textArr () {
    textArr[this.group_id] = new Map()

    let path = `${this.path}${this.group_id}.json`
    if (!fs.existsSync(path)) return

    try {
      let text = JSON.parse(fs.readFileSync(path, 'utf8'))
      for (let i in text) {
        if (text[i][0] && !Array.isArray(text[i][0])) {
          text[i] = [text[i]]
        }

        textArr[this.group_id].set(String(i), text[i])
      }
    } catch (error) {
      logger.error(`json格式错误：${path}`)
      delete textArr[this.group_id]
      return false
    }

    /** 加载表情 */
    let facePath = `${this.facePath}${this.group_id}`

    if (fs.existsSync(facePath)) {
      const files = fs.readdirSync(`${this.facePath}${this.group_id}`).filter(file => /\.(jpeg|jpg|png|gif)$/g.test(file))
      for (let val of files) {
        let tmp = val.split('.')
        tmp[0] = tmp[0].replace(/_[0-9]{10}$/, '')
        if (/at|image/g.test(val)) continue

        if (textArr[this.group_id].has(tmp[0])) continue

        textArr[this.group_id].set(tmp[0], [[{
          local: `${facePath}/${val}`,
          asface: true
        }]])
      }
    }
  }

  /** 初始化全局已添加内容 */
  globalTextArr () {
    this.global_id = yzInfo.isTRSS ? 'global' : this.e.bot.uin
    textArr[this.global_id] = new Map()

    let globalPath = `${this.path}${this.global_id}.json`
    if (!fs.existsSync(globalPath)) return

    try {
      let text = JSON.parse(fs.readFileSync(globalPath, 'utf8'))

      for (let i in text) {
        if (text[i][0] && !Array.isArray(text[i][0])) {
          text[i] = [text[i]]
        }
        textArr[this.global_id].set(String(i), text[i])
      }
    } catch (error) {
      logger.error(`json格式错误：${globalPath}`)
      delete textArr[this.global_id]
      return false
    }

    /** 加载表情 */
    let globalFacePath = `${this.facePath}${this.global_id}`

    if (fs.existsSync(globalFacePath)) {
      const files = fs
        .readdirSync(`${this.facePath}${this.global_id}`)
        .filter((file) => /\.(jpeg|jpg|png|gif)$/g.test(file))

      for (let val of files) {
        let tmp = val.split('.')
        tmp[0] = tmp[0].replace(/_[0-9]{10}$/, '')
        if (/at|image/g.test(val)) continue

        if (textArr[this.global_id].has(tmp[0])) continue

        textArr[this.global_id].set(tmp[0], [
          [
            {
              local: `${globalFacePath}/${val}`,
              asface: true
            }
          ]
        ])
      }
    }
  }

  /** 分页 */
  pagination (pageNo, pageSize, array) {
    let offset = (pageNo - 1) * pageSize
    return offset + pageSize >= array.length ? array.slice(offset, array.length) : array.slice(offset, offset + pageSize)
  }

  /** 关键词转换成可发送消息 */
  async keyWordTran (msg) {
    /** 图片 */
    if (msg.includes('{image')) {
      let tmp = msg.split('{image')
      if (tmp.length > 2) return false

      let md5 = tmp[1].replace(/}|_|:/g, '')

      msg = segment.image(`http://gchat.qpic.cn/gchatpic_new/0/0-0-${md5}/0`)
      msg.asface = true
    } else if (msg.includes('{at:')) {
      let tmp = msg.match(/{at:(.+?)}/g)

      for (let qq of tmp) {
        qq = qq.match(/[1-9][0-9]{4,14}/g)[0]
        let member = await await this.e.bot.getGroupMemberInfo(this.group_id, Number(qq)).catch(() => { })
        let name = member?.card ?? member?.nickname
        if (!name) continue
        msg = msg.replace(`{at:${qq}}`, `@${name}`)
      }
    } else if (msg.includes('{face')) {
      let tmp = msg.match(/{face(:|_)(.+?)}/g)
      if (!tmp) return msg
      msg = []
      for (let face of tmp) {
        let id = face.match(/\d+/g)
        msg.push(segment.face(id))
      }
    }

    return msg
  }
}
