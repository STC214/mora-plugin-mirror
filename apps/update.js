import plugin from '../../../lib/plugins/plugin.js'
import { exec } from 'child_process'
import { pluginPath } from '../components/index.js'

export class updateMora extends plugin {
  constructor () {
    super({
      name: '摩拉更新',
      dsc: '摩拉插件更新',
      event: 'message',
      priority: 5000,
      rule: [
        {
          reg: '^#摩拉(强制)?更新$',
          fnc: 'updateMoraPlugin'
        }
      ]
    })
  }

  async updateMoraPlugin (e) {
    let timer
    if (!await this.checkAuth(e)) return true
    let isForce = e.msg.includes('强制')
    let command = 'git pull --no-rebase'
    if (isForce) {
      command = `git checkout . && ${command}`
      e.reply('正在执行强制更新操作，请稍等')
    } else {
      e.reply('正在执行更新操作，请稍等')
    }
    exec(command, {
      cwd: pluginPath
    }, function (error, stdout, stderr) {
      // console.log(stdout);
      if (/Already up[ -]to[ -]date/.test(stdout) || stdout.includes('最新')) {
        e.reply('目前已经是最新版摩拉插件了~')
        return true
      }
      if (error) {
        e.reply('摩拉插件更新失败！\nError code: ' + error.code + '\n' + error.stack + '\n 请稍后重试。')
        return true
      }
      e.reply('摩拉插件更新成功，尝试重新启动Yunzai以应用更新...')
      timer && clearTimeout(timer)
      redis.set('Mora:restart-msg', JSON.stringify({
        msg: '重启成功，新版摩拉插件已经生效',
        qq: e.user_id
      }), {
        EX: 30
      })
      timer = setTimeout(function () {
        let command = 'npm run start'
        if (process.argv[1].includes('pm2')) command = 'npm run restart'
        exec(command, function (error, stdout, stderr) {
          if (error) {
            e.reply('自动重启失败，请手动重启以应用新版摩拉插件。\nError code: ' + error.code + '\n' +
              error.stack + '\n')
            Bot.logger.error(`重启失败\n${error.stack}`)
            return true
          } else if (stdout) {
            Bot.logger.mark('重启成功，运行已转为后台，查看日志请用命令：pnpm run log')
            Bot.logger.mark('停止后台运行命令：npm stop')
            process.exit()
          }
        })
      }, 1000)
    })
    return true
  }

  async checkAuth (e) {
    return await e.checkAuth({
      auth: 'master',
      replyMsg: `只有主人才能命令我哦~
      (*/ω＼*)`
    })
  }
}
