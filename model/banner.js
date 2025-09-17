import _ from 'lodash'
import gsCfg from '../../genshin/model/gsCfg.js'
import moment from 'moment'
import fs from 'node:fs'
import moraBase from './moraBase.js'
import moracfg from './config.js'
import commonTools from './commonTools.js'
import { Weapon } from '#miao.models'
import { poolDetail, mixPoolDetail } from '../../miao-plugin/resources/meta-gs/info/index.js'
import { poolDetailSr } from '../../miao-plugin/resources/meta-sr/info/index.js'

export default class banner extends moraBase {
  constructor (e) {
    super(e)
    this.path = moracfg.getGameRes('banner')
    this.game = this.e.game || 'gs'
  }

  async schedules (type) {
    if (!this.checkPlus(this.path)) return false

    let dir = fs.readdirSync(this.path)
    if (this.game === 'sr') dir = _.filter(dir, v => v.includes('星'))
    if (type) dir = _.filter(dir, v => v.includes(type))

    let msg = []
    _.each(dir, v => {
      let imgPath = `${this.path}/${v}`
      if (fs.existsSync(imgPath)) {
        msg.push(segment.image(`file://${imgPath}`))
      }
    })

    if (_.isEmpty(msg)) return false
    return await commonTools.makeMsg(this.e, msg, '复刻时间表')
  }

  async searchBanners (query) {
    let name = this.getBanner(query)
    if (!name) {
      await this.e.reply('常驻角色不支持查询')
      return false
    }

    let pool = this.getPool(name)
    if (!pool) return false

    return await commonTools.makeMsg(this.e, pool, `${name.name}卡池详情`, true)
  }

  /**
   * 查询卡池类型
   * @param {String} name 角色
   * @returns 卡池类型，名字
   */
  getBanner (query) {
    let name = query
    const pool = {
      gs: [301, 302],
      sr: [11, 12],
      zzz: [2001, 3001]
    }
    let type = pool[this.game][0]
    let typeName = 'char'
    const notUP = {
      gs: ['安柏', '凯亚', '丽莎', '刻晴', '莫娜', '七七', '迪卢克', '琴', '提纳里', '迪希雅', '梦见月瑞希'],
      sr: ['姬子', '瓦尔特', '杰帕德', '布洛妮娅', '彦卿', '白露', '克拉拉'],
      zzz: ['猫又', '莱卡恩', '「11号」', '格莉丝', '珂蕾妲', '丽娜']
    }

    let role = gsCfg.getRole(name, '', false, this.game)
    if (role) {
      // 角色
      name = role.name
      if (_.some(notUP, v => v.includes(name))) return false
    } else {
      // 武器
      type = pool[this.game][1]
      name = this.getWeapon(name)
      typeName = 'weapon'
    }

    return { type, name, typeName }
  }

  /**
   * 武器查询
   * @param {String} name 武器名
   * @returns 武器
   */
  getWeapon (name) {
    let weapon = name
    weapon = Weapon.get(name)
    if (weapon) weapon = weapon.name
    else weapon = this.getWeaponFullName(name)
    return weapon
  }

  /**
   * 武器全名
   * @param {String} weapon 武器名称
   * @returns 武器全名
   */
  getWeaponFullName (weapon) {
    let find = gsCfg.getdefSet('weapon', this.game === 'gs' ? 'other' : `${this.game}_other`).sortName
    find = _.findKey(find, v => _.isEqual(v, weapon))

    return find || weapon
  }

  /**
   * 查询卡池
   * @param {object} banner 卡池
   * @returns 卡池
   */
  getPool (banner) {
    const { type, name, typeName } = banner

    let miaoPool = []
    if (this.game === 'gs') miaoPool = poolDetail
    else if (this.game === 'sr') miaoPool = poolDetailSr

    const poolCfg = gsCfg.getdefSet('pool', type)

    miaoPool = _(miaoPool).unionBy(poolCfg, 'to').uniqBy('from').orderBy(['from', 'to'], ['desc', 'asc']).value()

    const rarity = _.filter(miaoPool, v => {
      if (_.includes(v.five || v[`${typeName}5`], name)) return true
      else if (_.includes(v.four || v[`${typeName}4`], name)) return true
      else return false
    })

    if (!rarity.length) return false

    // 计算天数
    let { from, to } = rarity[0]
    from = moment(from).startOf('d')
    to = moment(to).startOf('d')

    const today = moment().startOf('d')
    let elapsed = today.diff(to, 'd')

    let tips = `${elapsed}天未复刻`
    if (elapsed <= 0) {
      let next = today.diff(from, 'd')
      next = Math.min(next, 0)

      elapsed = elapsed ? `还有${Math.abs(next || elapsed)}` : '今'
      tips = `${next ? '下' : '当'}期UP，${elapsed}天${next ? '开启' : '结束'}卡池`
    }

    // 整合卡池内容
    let pool = []
    rarity.forEach(i => {
      let _pool = []
      if (i.version && i.half) _pool.push(`所属版本：${i.version} ${i.half}`)
      if (i.name) _pool.push(`卡池名称：${i.name.replace('|', '，')}`)
      _pool = _.concat(_pool, [
        `五星UP：${(i.five || i[`${typeName}5`]).join('，')}`,
        `四星UP：${(i.four || i[`${typeName}4`]).join('，')}`,
        `开始时间：${i.from}`,
        `结束时间：${i.to}`
      ])
      pool.push(_pool.join('\n'))
    })

    return [tips, ...pool]
  }
}
