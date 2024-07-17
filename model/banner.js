import _ from 'lodash'
import gsCfg from '../../genshin/model/gsCfg.js'
import moment from 'moment'
import fs from 'node:fs'
import moraBase from './moraBase.js'
import moracfg from './config.js'
import commonTools from './commonTools.js'
import { Weapon } from '#miao.models'

export default class banner extends moraBase {
  constructor (e) {
    super(e)
    this.path = moracfg.getGameRes('banner')
    this.game = this.e.game || 'gs'
  }

  async schedules (type) {
    if (!fs.existsSync(this.path)) {
      await this.e.reply('还没下载资源包，复刻表功能用不了捏')
      return false
    }

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

    let pool = this.getPool(name.type, name.name)
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
    let pool = {
      gs: [301, 302],
      sr: [11, 12],
      zzz: [2001, 3001]
    }
    let type = pool[this.game][0]
    let notUP = {
      gs: ['安柏', '凯亚', '丽莎', '刻晴', '莫娜', '七七', '迪卢克', '琴', '提纳里', '迪希雅'],
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
    }

    return { type, name }
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
   * @param {Number} type 卡池类型
   * @param {String} name 卡池名字
   * @returns 卡池
   */
  getPool (type, name) {
    let poolCfg = gsCfg.getdefSet('pool', type)
    // 五星
    let rarity = _.filter(poolCfg, v => _.includes(v.five, name))
    // 四星
    if (_.isEmpty(rarity)) rarity = _.filter(poolCfg, v => _.includes(v.four, name))
    // 找不到
    if (_.isEmpty(rarity)) return false

    // 计算天数
    let latest = rarity[0]
    let today = moment().format('YYYY-MM-DD')
    let end = moment(latest.to).format('YYYY-MM-DD')
    let elapsed = moment(today).diff(end, 'days')
    if (elapsed > 0) elapsed = `${elapsed}天未复刻`
    else elapsed = `当期UP，${elapsed < 0 ? '还有' + Math.abs(elapsed) : '今'}天结束卡池`

    // 整合卡池内容
    let pool = []
    rarity.forEach(i => {
      let _pool = []
      if (i.version && i.half) _pool.push(`所属版本：${i.version} ${i.half}`)
      if (i.name) _pool.push(`卡池名称：${i.name.replace('|', '，')}`)
      _pool = _.concat(_pool, [
        `五星UP：${i.five.join('，')}`,
        `四星UP：${i.four.join('，')}`,
        `开始时间：${i.from}`,
        `结束时间：${i.to}`
      ])
      pool.push(_pool.join('\n'))
    })

    return [elapsed, ...pool]
  }
}
