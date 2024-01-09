import moraBase from './moraBase.js'
import fetch, { Headers } from 'node-fetch'
import gsCfg from '../../genshin/model/gsCfg.js'
import _ from 'lodash'
import commonTools from './commonTools.js'

export default class AkashaDB extends moraBase {
  constructor (e) {
    super(e)
    this.model = 'AkashaDB'
  }

  async getData () {
    let v = Math.random() * 10
    let abyss_url = `https://akashadata.com/static/data/abyss_total.js?v=${v}`
    let role_url = `https://t.akashadata.com/xstatic/json/static_card_dict.js?v=${v}`

    let role_res = await this.fetch_data(role_url)
    if (!role_res) return false
    await redis.set(`${this.prefix}role_dict`, JSON.stringify(role_res))

    let abyss_res = await this.fetch_data(abyss_url)
    if (!abyss_res) return false

    _.each(abyss_res.character_used_list, v => {
      let role = gsCfg.getRole(v.name)
      v.name = role.name
    })

    abyss_res.team_list = this.transTeamList(abyss_res.team_list, role_res)
    abyss_res.team_up_list = this.transTeamList(abyss_res.team_up_list, role_res)
    abyss_res.team_down_list = this.transTeamList(abyss_res.team_down_list, role_res)

    await redis.set(`${this.prefix}abyss_total`, JSON.stringify(abyss_res))
    return true
  }

  async fetch_data (url) {
    const meta = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.42' }
    let myHeaders = new Headers(meta)

    let res = await fetch(url, { headers: myHeaders, method: 'get', redirect: 'follow' })
    if (!res.ok) return false

    if (_.includes(url, '.js')) {
      res = await res.text()
      res = JSON.parse(res.split('=')[1])
    } else {
      res = await res.json()
    }

    return res
  }

  /**
  * 获取数据
  * @param {String} url 请求地址
  * @returns json数据
  */
  async getUsageRate (rarity) {
    let data = await this.get_data('abyss_total')
    let usageData = {
      abyssVersion: data.schedule_version_desc,
      updateTime: data.modify_time,
      characterList: this.listFilter(data.character_used_list, rarity)
    }

    let render = await commonTools.getRenderData('Akasha', 'abyss', usageData)
    return render
  }

  async teamsPage (half, sort, page) {
    let data = await this.get_data('abyss_total')
    let teamList = data.team_list
    let _sort = 'mr'
    let _count = 'ac'
    if (_.isEqual(half, '上半')) {
      teamList = data.team_up_list
      _sort = 'umr'
      _count = 'uc'
    } else if (_.isEqual(half, '下半')) {
      teamList = data.team_down_list
      _sort = 'dmr'
      _count = 'dc'
    }
    if (_.isEqual(sort, '满星率')) {
      teamList = _.orderBy(teamList, [_sort], ['desc'])
    }
    _.each(teamList, v => {
      v.count = v[_count]
      v.fullstar = v[_sort]
    })

    teamList = _.chunk(teamList, 14)
    let teamData = {
      abyssVersion: data.schedule_version_desc,
      updateTime: data.modify_time,
      page,
      teamList: teamList[page - 1]
    }

    let render = await commonTools.getRenderData('Akasha', 'teams', teamData)
    return render
  }

  async get_data (key) {
    key = `${this.prefix}${key}`
    if (!await redis.exists(key)) await this.getData()
    return JSON.parse(await redis.get(key))
  }

  /**
   * 筛选数据
   * @param {Array} list 原数据
   * @param {Number} rarity 稀有度(筛选条件)
   * @returns 筛选后的数据
   */
  listFilter (list, rarity) {
    return rarity ? _.filter(list, v => _.isEqual(v.rarity, rarity)) : list
  }

  transTeamList (list, role_res) {
    _.each(list, v => {
      v.tl = _.map(v.tl, i => role_res[i].name)
      v.mr = Number(v.mr)
      v.uc = Number(v.uc)
      v.dc = Number(v.dc)
      v.umr = Number(v.umr)
      v.dmr = Number(v.dmr)
    })

    return list
  }

  roleCheck (roles) {
    if (!_.isEmpty(roles)) {
      roles = roles.split(/,|，/g)
      for (let i of roles) {
        let role = gsCfg.getRole(i)
        if (!role) {
          this.e.reply(`角色：${i}无法查询，请检查角色名称'`)
          return false
        }
        i = role.name
      }
    }
    return roles || []
  }
}
