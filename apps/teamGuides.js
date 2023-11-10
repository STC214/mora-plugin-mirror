import plugin from '../../../lib/plugins/plugin.js'
import _ from 'lodash'
import Team from '../model/team.js'

/**
 *
 * @author Rrrrrrray
 */
export class teamGuides extends plugin {
  constructor () {
    super({
      name: '角色配队一图流',
      dsc: '角色配队一图流 @茗血茶',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#\\S+配队$',
          fnc: 'teamGuides'
        }
      ]
    })
  }

  async teamGuides () {
    let query = /^#(\S+)配队$/.exec(this.e.msg)[1]
    if (_.includes(query, '深渊')) {
      return false
    }

    let msg = await new Team(this.e).guides(query)
    if (!msg) return false

    await this.e.reply(msg)
    return true
  }
}
