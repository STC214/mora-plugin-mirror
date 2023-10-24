import plugin from '../../../lib/plugins/plugin.js'
import { exec } from 'child_process'
import moracfg from '../model/config.js'
import commonTools from '../model/commonTools.js'
import puppeteer from '../../../lib/puppeteer/puppeteer.js'
import fs from 'node:fs'
import _ from 'lodash'
import common from '../../../lib/common/common.js'

/**
 * 帮助借鉴白纸
 * 资源包借鉴喵喵、图鉴
 */
export class moraHelp extends plugin {
  constructor () {
    super({
      name: '摩拉帮助',
      dsc: '摩拉插件帮助',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#摩拉帮助$',
          fnc: 'moraHelp'
        },
        {
          reg: '^#(强制)?更新摩拉资源$',
          fnc: 'updateMoraRes',
          permission: 'master'
        }
      ]
    })
    this.task = {
      name: '摩拉资源更新检测',
      fnc: () => this.updateMoraRes(),
      cron: '0 0 3 * * ?'
    }
    this.helpPath = moracfg.getMoraPath('def')
    this.resPath = moracfg.getMoraPath('plus')
  }

  async moraHelp () {
    let help = moracfg.getfileYaml(this.helpPath, 'help')
    help.isMaster = this.e.isMaster
    help.iconPath = `${moracfg.getMoraPath('res')}img/icons/`
    let render = await commonTools.getRenderData('Help', 'help', help)
    let img = await puppeteer.screenshot('moraHelp', render)
    if (img) await this.reply(img)
  }

  async updateMoraRes (e) {
    let msg = e?.msg || ''
    let manual = !!msg
    let force = _.includes(msg, '强制')
    let command = ''

    if (fs.existsSync(this.resPath)) {
      command = 'git pull --no-rebase'
      if (force) {
        command = `git checkout . && ${command}`
        e.reply('正在强制更新...')
      } else {
        logger.mark('摩拉资源检测中...')
        if (manual) e.reply('正在更新...')
      }

      common.sleep(_.random(3600000))
      exec(command, { cwd: this.resPath }, (error, stdout, stderr) => {
        if (/Already up to date/.test(stdout) || stdout.includes('最新')) {
          if (manual) e.reply('资源包已经是最新了~')
          return true
        }
        let changed = /(\d*) files changed,/.exec(stdout)
        if (changed && changed[1]) {
          if (manual) e.reply(`资源包更新成功，此次更新了${changed[1]}个~`)
          else logger.mark(`摩拉资源成功更新${changed[1]}个`)
          return true
        }
        if (error) {
          if (manual) {
            e.reply(`更新失败！\nError code: ${error.code}\n${error.stack}\n 请稍后重试。`)
          } else {
            logger.error(`更新失败！\nError code: ${error.code}\n${error.stack}`)
          }
        } else {
          if (manual) e.reply('摩拉资源包更新成功~')
          else logger.mark('摩拉资源更新成功~')
        }
      })
    } else if (manual) {
      command = `git clone --depth=1 https://gitee.com/Rrrrrrray/mora-plugin-res.git "${this.resPath}"`
      exec(command, (error, stdout, stderr) => {
        if (error) {
          e.reply(`资源包安装失败！\nError code: ${error.code}\n${error.stack}\n 请稍后重试。`)
        } else {
          e.reply('摩拉资源包更新成功！后续也可以通过【#更新摩拉资源】更新资源包')
        }
      })
    } else {
      return true
    }
    return true
  }
}
