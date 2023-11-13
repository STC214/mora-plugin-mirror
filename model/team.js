import moraBase from './moraBase.js'
import commonTools from './commonTools.js'
import gsCfg from '../../genshin/model/gsCfg.js'
import _ from 'lodash'
import fs from 'node:fs'
import moracfg from './config.js'
import common from '../../../lib/common/common.js'

export default class team extends moraBase {
  constructor (e) {
    super(e)
    this.game = this.e.game || 'gs'
    this.isSr = this.game === 'sr'
    this.path = moracfg.getMoraPlus(this.game, 'team')
  }

  async guides (query) {
    if (!fs.existsSync(this.path)) {
      await this.e.reply(moracfg.resNotFound, true)
      return false
    }

    let teams = moracfg.getfileYaml(`${this.path}/`, 'teamGuides')
    teams = this.searchTeams(teams, query)

    if (!_.isEmpty(teams.traveler)) {
      await this.e.reply(teams.traveler)
      return false
    }
    if (!teams.find) {
      await this.e.reply(`暂无${query}配队捏`)
      return false
    }

    teams = _.filter(teams.find, v => fs.existsSync(`${this.path}/${v}`))
    if (_.isEmpty(teams)) {
      logger.error('图片获取失败')
      await this.e.reply('没找到捏，是不是没更新资源包捏捏捏捏捏？')
      return false
    }

    let msg = _.map(teams, v => segment.image(`file://${this.path}/${v}`))
    if (msg.length > 1) {
      msg = await common.makeForwardMsg(this.e, msg, `${query}配队详情`)
    } else {
      msg = msg[0]
    }

    return msg
  }

  searchTeams (teams, query) {
    let names = _.keys(teams['茗血茶'])

    // 队名
    if (_.endsWith(query, '队')) {
      query = _.replace(query, '队', '')
    }
    let find_tname = _.filter(names, v => v.includes(query))
    // 别名
    let alias = _.mapValues(teams['茗血茶'], 'alias')
    alias = _.pickBy(alias, v => v.includes(query))
    let find_alias = _.keys(alias)

    // 角色
    let traveler = ''
    let role = gsCfg.getRole(query)
    let find_rname = []
    let team2 = []
    if (role) {
      /** 主角特殊处理 */
      if (_.includes(commonTools.travelerID(), String(role.roleId))) {
        traveler = commonTools.traveler(role.alias, query, '配队')
        if (_.isEqual(role.alias, traveler)) {
          role.name = traveler
          traveler = ''
        }
      }
      let roles = _.mapValues(teams['茗血茶'], 'role')
      roles = _.pickBy(roles, v => v.includes(role.name))
      find_rname = _.keys(roles)

      team2 = _.pickBy(teams['卡玛sei亚'], v => v.includes(role.name))
      team2 = _.keys(team2)
    }

    let team1 = _.uniq(_.concat(find_tname, find_alias, find_rname))
    team1 = _.map(team1, v => `茗血茶/${v}.png`)
    team2 = _.map(team2, v => `卡玛sei亚/${v}.png`)
    names = _.concat(team1, team2)

    return {
      find: _.isEmpty(names) ? false : names,
      traveler
    }
  }
}
