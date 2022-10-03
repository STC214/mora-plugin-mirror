import fetch from 'node-fetch';
import fs from 'fs';
import { segment } from "oicq";
import common from "../components/common.js";
import { botConfig } from "../components/common.js";
import YAML from 'yaml';
import moracfg from '../model/config/config.js'

const _path = process.cwd();
const plugin = "mora-plugin"
const dataPath=`${_path}/plugins/${plugin}/data/`;

let WeiboPush = {}; // 推送对象列表

if (!fs.existsSync(dataPath)) {
  fs.mkdirSync(dataPath);
}

if (!fs.existsSync(`${dataPath}/weibo/`)) {
  fs.mkdirSync(`${dataPath}/weibo/`);
}

/** 接口地址 */
const weiboUserApiUrl = 'https://m.weibo.cn/api/container/getIndex';

// 初始化获取B站推送信息
/** 
async function initWeiboPushJson() {
  if (fs.existsSync(weiboPath + "/data/PushNews/PushWeibo.json")) {
    PushBilibiliDynamic = JSON.parse(fs.readFileSync(_path + "/data/PushNews/PushWeibo.json", "utf8"));
  } else {
    savePushJson();
  }

  if (fs.existsSync(_path + "/data/PushNews/WeiboPushConfig.json")) {
    BilibiliPushConfig = JSON.parse(fs.readFileSync(_path + "/data/PushNews/WeiboPushConfig.json", "utf8"));

    // 如果设置了过期时间
    let faultTime = Number(BilibiliPushConfig.dynamicPushFaultTime);
    let temp = DynamicPushTimeInterval;
    if (!isNaN(faultTime)) {
      temp = common.getRightTimeInterval(faultTime);
      temp = temp < 1 ? 1 : temp; // 兼容旧设置
      temp = temp > 24 ? 24 : temp; // 兼容旧设置
      temp = temp * 60 * 60 * 1000;
    }
    DynamicPushTimeInterval = temp; // 允许推送多久以前的动态

    // 如果设置了间隔时间
    let timeInter = Number(BilibiliPushConfig.dynamicPushTimeInterval);
    if (!isNaN(timeInter)) {
      pushTimeInterval = common.getRightTimeInterval(timeInter);
    }

  } else {
    BilibiliPushConfig = {
      allowPrivate: true,
    };
    saveConfigJson();
  }
}
// 初始化
initWeiboPushJson(); */


/** 订阅/取消 微博用户 */
export async function updateWeiboList(e) {
  if (e.isGroup && !common.isGroupAdmin(e) && !e.isMaster) {
    e.reply("哒咩，只有管理员和master可以操作哦");
    return true;
  }

  // 推送对象记录
  let pushID = e.isGroup ? e.group_id : e.user_id;
  if (!pushID) {
    return true;
  }

  let subsMap = await moracfg.getWeiboMap(pushID);
  // let temp = WeiboPush[pushID];
  // if (!temp) {
  //   e.reply("你还妹在这里开启过微博动态推送呢");
  //   return true;
  // }


  let msgList = e.msg.split("微博");
  const addComms = ["订阅", "添加", "新增", "增加", "#订阅", "#添加", "#新增", "#增加"];
  const delComms = ["删除", "移除", "去除", "取消", "#删除", "#移除", "#去除", "#取消"];

  let uid = msgList[1].trim();
  let operComm = msgList[0];

  // uid或者用户名可不能缺
  if (!uid) {
    e.reply(`UID呢？我那么大个UID呢？\n示例：${operComm}微博推送 5896401674`);
    return true;
  }

  /** 
  let uids = temp.biliUserList.map((item) => item.uid);
  let names = temp.biliUserList.map((item) => item.name);

  // 删除B站推送的时候，可以传UID也可以传用户名
  if (delComms.indexOf(operComm) > -1) {
    let isExist = false;

    if (uids.indexOf(uid) > -1) {
      PushBilibiliDynamic[pushID].biliUserList = temp.biliUserList.filter((item) => item.uid != uid);
      isExist = true;
    }
    if (names.indexOf(uid) > -1) {
      PushBilibiliDynamic[pushID].biliUserList = temp.biliUserList.filter((item) => item.name != uid);
      isExist = true;
    }

    if (!isExist) {
      e.reply("别闹，介个微博用户你都妹加过");
      return true;
    }

    savePushJson();
    e.reply("删掉咯~后悔了就再加回来吧");

    return true;
  }
  */

  if (isNaN(Number(uid))) {
    e.reply(`${uid} <- 你介可不是UID吧？\n示例：${operComm}B站推送 5896401674`);
    return true;
  }

  // 添加只能是 uid 的方式添加
  if (addComms.indexOf(operComm) > -1) {
    if (!subsMap && subsMap.has(Number(uid))) {
      e.reply("别闹，介UID已经加过了");
      return true;
    }

    let url = `${weiboUserApiUrl}?type=uid&value=${uid}`;
    let res = await fetch(url, { method: "get" }).catch((err) => logger.error(err));;

    if (!res.ok) {
      e.reply("哦噢，出了点问题，可能是本大爷网络不好也可能是B站出了问题呢，等会再试试吧~");
      return true;
    }

    res = await res.json();

    let data = res.data || [];
    if (!data) {
      e.reply("老实说，介UID是不是你自己瞎填的？");
      return true;
    }
    
    let userdata = data.userInfo || [];
    let containerid = Number(data.tabsInfo.tabs[1].containerid) || []
    let preMsg = '';

    let savedata = {};
    let savelist = [];
    savedata = {
      qq: pushID,
      isGroup: e.isGroup || false,
      isPush: true
    }
    savelist.push({
      weiboId: userdata.id,
      weiboName: userdata.screen_name,
      containerid: containerid
    })
    savedata["weiboPushList"] = savelist;
    await moracfg.saveWeiboList(e.user_id, savedata);
    e.reply(`${preMsg}添加成功~\n${userdata.screen_name}：${uid}`);
  }

  return true;
}

// 用户api
export async function getWeibo (e) {
  /** e.msg 用户的命令消息 */
  logger.info('[用户命令]', e.msg);

  /** 获取微博用户页面 */
  // 推送对象记录
  let pushID = e.group_id || e.user_id;
  if (!pushID) {
    return true;
  }

  let subsMap = await moracfg.getWeiboMap(pushID);
  let url, weibotxt = '';
  subsMap.forEach(async (v,k) => {
    url = `${weiboUserApiUrl}?type=uid&value=${k}&containerid=${v}`;
    weibotxt = await getLatestWeibo(url);

    /** 输入日志 */
    logger.info(`[接口结果] 微博：${weibotxt}`);
    /** 最后回复消息 */
    await e.reply(`微博：${weibotxt}`)
  });
}

async function getLatestWeibo(url){
  /** 调用接口获取数据 */
  let userRes = await fetch(url).catch((err) => logger.error(err));

  /** 判断接口是否请求成功 */
  if (!userRes) {
    logger.error('[微博] 接口请求失败')
    return await e.reply('微博接口请求失败')
  }

  /** 接口结果，json字符串转对象 */
  userRes = await userRes.json();
  let cards = userRes.data.cards;
  let weibotxt = '';
  /** 获取不是置顶的第一条微博 */
  for(let c in cards){
    let mblog = cards[c].mblog;
    let isTop = mblog.mblogtype;
    if (isTop === 0) {
      weibotxt = mblog.text;
      break;
    }
  }
  return weibotxt;
}
