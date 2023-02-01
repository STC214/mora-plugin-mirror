import plugin from "../../../lib/plugins/plugin.js";
import { exec } from "child_process";
import { pluginPath } from "../components/index.js";
const _path = process.cwd();

export class updateMora extends plugin {
  constructor() {
    super({
      name: '摩拉更新',
      dsc: '摩拉插件更新',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: "^#摩拉(强制)?更新$",
          fnc: 'updateMoraPlugin'
        }
      ]
    })
  }

  async updateMoraPlugin(e) {
    let timer;
    if (!await this.checkAuth(e)) {
      return true;
    }
    let isForce = e.msg.includes("强制");
    let command = "git  pull";
    if (isForce) {
      command = "git  checkout . && git  pull";
      e.reply("正在执行强制更新操作，请稍等");
    } else {
      e.reply("正在执行更新操作，请稍等");
    }
    exec(command, {
      cwd: pluginPath
    }, function(error, stdout, stderr) {
      //console.log(stdout);
      if (/Already up[ -]to[ -]date/.test(stdout)||stdout.includes("最新")) {
        e.reply("目前已经是最新版摩拉插件了~");
        return true;
      }
      if (error) {
        e.reply("摩拉插件更新失败！\nError code: " + error.code + "\n" + error.stack + "\n 请稍后重试。");
        return true;
      }
      e.reply("摩拉插件更新成功，尝试重新启动Yunzai以应用更新...");
      timer && clearTimeout(timer);
      redis.set("mora:restart-msg", JSON.stringify({
        msg: "重启成功，新版摩拉插件已经生效",
        qq: e.user_id
      }), {
        EX: 30
      });
      timer = setTimeout(function() {
        let command = `npm run start`;
        if (process.argv[1].includes("pm2")) {
          command = `npm run restart`;
        }
        exec(command, function(error, stdout, stderr) {
          if (error) {
            e.reply("自动重启失败，请手动重启以应用新版摩拉插件。\nError code: " + error.code + "\n" +
              error.stack + "\n");
            Bot.logger.error('重启失败\n${error.stack}');
            return true;
          } else if (stdout) {
            Bot.logger.mark("重启成功，运行已转为后台，查看日志请用命令：pnpm run log");
            Bot.logger.mark("停止后台运行命令：npm stop");
            process.exit();
          }
        })
      }, 1000);
  
    });
    return true;
  }

  async checkAuth(e) {
    return await e.checkAuth({
      auth: "master",
      replyMsg: `只有主人才能命令我哦~
      (*/ω＼*)`
    });
  }
}

// 更新插件内容
/** export async function updateMoraPlugin(e = {}) {
  if (!e.isMaster) {
    e.reply("哒咩，你可不是老娘的master");
    return true;
  }
  
  let command = "git  pull";
  e.reply("马上给你更新，稍等一下");
  
  exec(command, { cwd: `${_path}/plugins/mora-plugin/` }, function (error, stdout, stderr) {
    if (/Already up[ -]to[ -]date/.test(stdout)) {
      e.reply("啊这，没有可以更新的内容呢");
      return true;
    }
    if (error) {
      e.reply(`更新失败了呜呜呜\nError code: ${error.code}\n等会再试试吧`);
      // e.reply("更新失败！\nError code: " + error.code + "\n" + error.stack + "\n 请稍后重试。");
      return true;
    }
    e.reply("更新完成！请发送 #重启 或者手动重启吧~");
  });

  return true;
}*/

