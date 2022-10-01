import plugin from '../../../lib/plugins/plugin.js'
import * as Mora from '../apps/index.js'
import { render } from './render.js'

export class mora extends plugin {
  constructor () {
    let rule = {
      reg: '.+',
      fnc: 'dispatch'
    }
    super({
      name: 'mora-plugin',
      desc: '摩拉插件',
      event: 'message',
      priority: 50,
      rule: [rule]
    })
    Object.defineProperty(rule, 'log', {
      get: () => !!this.isDispatch
    })
  }

  async dispatch (e) {
    let msg = e.original_msg || 'not original_msg'
    if (!msg) {
      return false
    }
    msg = msg.replace('#', '').trim()
    msg = '#' + msg
    for (let fn in Mora.rule) {
      let cfg = Mora.rule[fn]
      if (Mora[fn] && new RegExp(cfg.reg).test(msg)) {
        let ret = await Mora[fn](e, {
          render
        })
        if (ret === true) {
          this.isDispatch = true
          return true
        }
      }
    }
    return false
  }
}
