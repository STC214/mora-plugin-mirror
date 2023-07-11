import _ from 'lodash'
import gsCfg from "../../genshin/model/gsCfg.js"
import moment from 'moment'
import fs from 'node:fs'
import moraBase from './moraBase.js'
import moracfg from './config.js'
import common from '../../../lib/common/common.js'

export default class banner extends moraBase {
  constructor (e) {
    super(e)
    this.path = moracfg.getMoraPlus('banner') 
  }

  async schedules (type) {
    if (!fs.existsSync(this.path)) {
      await this.e.reply('还没下载资源包，复刻表功能用不了捏')
      return false
    }

    let isSr = this.e?.isSr || false
    let dir = fs.readdirSync(this.path)
    if (isSr) {
      dir = _.filter(dir, v.includes('星'))
    }
    if (type) {
      dir = _.filter(dir, v.includes(type))
    }
    
    let msg = []
    _.each(dir, v => {
      let imgPath = `${this.path}/${v}`
      if (fs.existsSync(imgPath)) {
        msg.push(segment.image(`file://${imgPath}`))
      }
    })

    if (_.isEmpty(msg)) {
      return false
    }

    if (msg.length > 1) {
      msg = await common.makeForwardMsg(this.e, msg, `复刻时间表`)
    } else {
      msg = msg[0]
    }
    return msg
  }

  async searchBanners (query) {
    let name = this.getBanner(query)
    if (!name) {
      await this.e.reply('常驻角色不支持查询')
      return false      
    }

    let pool = this.getPool(name.type, name.name)
    if (!pool) {
      return false
    }

    let msg = [`${name.name}卡池详情`, ...pool]
    return await common.makeForwardMsg(this.e, msg, msg[0])
  }

  /**
   * 查询卡池类型
   * @param {String} name 角色
   * @returns 卡池类型，名字
   */
  getBanner (query) {
    let name = query
    let type = 301
    let notUP = ['安柏', '凯亚', '丽莎', '刻晴', '莫娜', '七七', '迪卢克', '琴', '提纳里']
    let role = gsCfg.getRole(name)
    if (role) {
      // 角色
      name = role.name
      if (notUP.includes(name)) {
        return false
      }
    } else {
      // 武器
      type = 302
      name = this.getWeapon(name)
    }

    return { 
      type: type,
      name: name
    }
  }

  /**
   * 武器查询
   * @param {String} name 武器名
   * @returns 武器
   */
  getWeapon (name) {
    let weapon = name
    let weapons = gsCfg.getdefSet('weapon','data').Name
    let names = _.values(weapons)
    if (!_.includes(names, weapon)) {
      weapon = this.getWeaponFullName(weapon)
    }
    return weapon
  }

  /** 
   * 武器全名
   * @param {String} weapon 武器名称
   * @returns 武器全名
   */
  getWeaponFullName (weapon) {
    let shortName = gsCfg.getdefSet('weapon','other').sortName
    weapon = _.findKey(shortName, v => _.isEqual(v, weapon))
    return weapon
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
    if (_.isEmpty(rarity)) {
      rarity = _.filter(poolCfg, v => _.includes(v.four, name))
    }
    // 找不到
    if (_.isEmpty(rarity)) {
      return false
    }

    // 计算天数
    let latest = rarity[0]
    let today = moment().format('YYYY-MM-DD')
    let end = moment(latest.to).format('YYYY-MM-DD')
    let elapsed = moment(today).diff(end, 'days')
    if (elapsed > 0) {
      elapsed = `${elapsed}天未复刻`
    } else {
      elapsed = `当期UP，${elapsed < 0 ? '还有' + Math.abs(elapsed) : '今'}天结束卡池`
    }
    
    // 整合卡池内容
    let pool = []
    rarity.forEach(i => {
      pool.push([
        `卡池名称：${i.name.replace('|', '，')}`,
        `五星UP：${i.five.join('，')}`,
        `四星UP：${i.four.join('，')}`,
        `开始时间：${i.from}`,
        `结束时间：${i.to}`
      ].join('\n'))
    })

    return [elapsed, ...pool]
  }
}