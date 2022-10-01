import plugin from '../../lib/plugins/plugin.js'
import fetch from 'node-fetch';
import fs from 'fs';

export class example extends plugin {
  constructor () {
    super({
      /** 功能名称 */
      name: '微博',
      /** 功能描述 */
      dsc: '微博订阅推送',
      /** https://oicqjs.github.io/oicq/#events */
      event: 'message',
      /** 优先级，数字越小等级越高 */
      priority: 5000,
      rule: [
        {
          /** 命令正则匹配 */
          reg: '^#微博$',
          /** 执行方法 */
          fnc: 'getWeibo'
        }
      ]
    })
  }
  /**
   * #微博
   * @param e oicq传递的事件参数e
   */
  // 用户api
  async getWeibo (e) {
    /** e.msg 用户的命令消息 */
    logger.info('[用户命令]', e.msg);

    /** 接口地址 */
    const weiboUserApiUrl = 'https://m.weibo.cn/api/container/getIndex';

    /** 获取微博用户页面 */
    let uid = 7455443910;
    let url = `${weiboUserApiUrl}?type=uid&value=${uid}`;

    /** 调用接口获取数据 */
    let userRes = await fetch(url).catch((err) => logger.error(err));

    /** 判断接口是否请求成功 */
    if (!userRes) {
      logger.error('[微博] 接口请求失败')
      return await this.reply('微博接口请求失败')
    }

    /** 接口结果，json字符串转对象 */
    userRes = await userRes.json();
    let containerid = userRes.data.tabsInfo.tabs[1].containerid;
    /** 输入日志 */
    logger.info(`[接口结果] 微博容器id：${containerid}`)

    /** 获取该用户微博页面 */
    url += `&containerid=${containerid}`;
    let weiboRes = await fetch(url).catch((err) => logger.error(err));
    if (!weiboRes) {
      logger.error('[微博] 接口请求失败')
      return await this.reply('微博接口请求失败')
    }

    /** 获取第一条微博 */
    weiboRes = await weiboRes.json();
    let weibotxt = weiboRes.data.cards[0].mblog.text;
    /** 输入日志 */
    logger.info(`[接口结果] 微博：${weibotxt}`)

    /** 最后回复消息 */
    await this.reply(`微博：${weibotxt}`)
  }
}

