import plugin from '../../../lib/plugins/plugin.js';
import { exec } from 'child_process';
import moracfg from '../model/config.js';
import commonTools from '../model/commonTools.js';
import puppeteer from '../../../lib/puppeteer/puppeteer.js';
import fs from 'node:fs';
import _ from 'lodash';

/**
 * 帮助借鉴白纸
 * 资源包借鉴喵喵、图鉴
 */
const _path = process.cwd();
export class moraHelp extends plugin {
  constructor () {
    super ({
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
    this.helpPath = moracfg.getMoraPath('def');
  }

  async moraHelp() {
    let help = moracfg.getfileYaml(this.helpPath, 'help');
    help['isMaster'] = this.e.isMaster;
    help['iconPath'] = `${moracfg.getMoraPath('res')}img/icons/`
    let render = await commonTools.getRenderData('Help', 'help', help);
    let img = await puppeteer.screenshot('moraHelp', render);
    if (img) await this.reply(img);
  }

  async updateMoraRes () {
    this.resPath = `${_path}/plugins/mora-plugin/resources/`;
    let force = _.includes(this.e.msg, '强制');
    let command = '';
    
    if (fs.existsSync(`${this.resPath}/mora-plugin-res/`)) {
      command = 'git pull';
      if (force) {
        command = 'git checkout . && git pull';
        await this.e.reply('正在强制更新...')
      } else {
        await this.e.reply('正在更新...')
      }
    } else {
      command = `git clone https://gitee.com/Rrrrrrray/mora-plugin-res.git '${this.resPath}mora-plugin-res/'`;
    }
    exec(command, { cwd: `${this.resPath}mora-plugin-res/` }, async (err, stdout, stderr) => {
      if (/Already up to date/.test(stdout) || stdout.includes("最新")) {
        await this.e.reply("资源包已经是最新了~");
        return true;
      }
      let changed = /(\d*) files changed,/.exec(stdout);
      if (changed && changed[1]) {
        await this.e.reply(`资源包更新成功，此次更新了${changed[1]}个~`);
        return true;
      }
      if (err) {
        await this.e.reply("更新失败！\nError code: " + err.code + "\n" + err.stack + "\n 请稍后重试。");
      } else {
        await this.e.reply("摩拉资源包更新成功！后续也可以通过【#更新摩拉资源】更新资源包");
      }
      return true;
    });
  }
}