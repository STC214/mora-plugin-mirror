import fetch from 'node-fetch';
import fs from 'fs';
import { segment } from "oicq";
import common from "../components/common.js";
import { botConfig } from "../components/common.js";
import YAML from 'yaml';
import moracfg from '../model/config.js'

const _path = process.cwd();
const plugin = "mora-plugin"
const dataPath=`${_path}/plugins/${plugin}/data/`;

// const DynamicPicCountLimit = 2; // 推送动态时，限制发送多少张图片
// const DynamicContentLenLimit = 50; // 推送文字和图文动态时，限制字数是多少
// const DynamicContentLineLimit = 3; // 推送文字和图文动态时，限制多少行文本

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

  let subsList = await moracfg.getWeiboList(pushID);
  let uidList = [];
  for(let subs in subsList) {
    uidList.push(subsList[subs].weiboId);
  }
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
    e.reply(`${uid} <- 你介可不是UID吧？\n示例：${operComm}微博推送 5896401674`);
    return true;
  }

  // 添加只能是 uid 的方式添加
  if (addComms.indexOf(operComm) > -1) {
    if (uidList.indexOf(Number(uid)) > -1) {
      e.reply("别闹，介UID已经加过了");
      return true;
    }

    let url = `${weiboUserApiUrl}?type=uid&value=${uid}`;
    let res = await fetch(url, { method: "get" }).catch((err) => logger.error(err));;

    if (!res.ok) {
      e.reply("哦噢，出了点问题，可能是本大爷网络不好也可能是微博出了问题呢，等会再试试吧~");
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
    await moracfg.saveWeiboList(pushID, savedata);
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
  let pushID = e.isGroup ? e.group_id : e.user_id;
  if (!pushID) {
    return true;
  }

  let subsList = await moracfg.getWeiboList(pushID);
  if(!subsList){
    return true;
  }
  let title = '';
  let msg = [];
  //   /** 最后回复消息 */
  //   // await e.reply(`${item.weiboName} 微博：${weibotxt}`);
  for(let subs in subsList){
    let url = `${weiboUserApiUrl}?type=uid&value=${subsList[subs].weiboId}&containerid=${subsList[subs].containerid}`;
    let mblog = await getLatestWeibo(url);

    // 格式化日期 Mon Oct 03 17:28:01 +0800 2022
    let date = new Date(mblog.created_at);
    let minute = date.getMinutes() > 10 ? date.getMinutes() : `0${date.getMinutes()}`
    date = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${minute}`

    title = `【${subsList[subs].weiboName}】微博推送：\n${date}`;

    // 获取图片
    let pics = mblog.pic_ids || [];
    pics = pics.map((item) => {
      return segment.image(`https://wx1.sinaimg.cn/orj360/${item}.jpg`);
    });
    
    // 处理内容去掉标签
    let txt = await replaceTXT(mblog.text);
    // 标题 时间 内容 图片 链接
    msg.push(title,txt, ...pics, `https://m.weibo.cn/detail/${mblog.mid}`);
  }
  // await sendWeibo(pushID, );
  msg = await common.replyMake(msg, e.isGroup, '微博推送~');
  /** 输入日志 */
  
  // logger.info(`[接口结果] 微博：${msg}`);
  if (e.isGroup) {
    Bot.pickGroup(pushID).sendMsg(msg).catch((err) => {
      logger.error(err)
    });
  } else {
    common.relpyPrivate(pushID, msg);
  }
  return true;
}

/** 获取最新非置顶微博 */
async function getLatestWeibo(url) {
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
  let mblog;
  /** 获取不是置顶的第一条微博 */
  for(let c in cards){
    mblog = cards[c].mblog;
    let isTop = mblog.mblogtype;
    if (isTop === 0) {
      break;
    }
  }
  return mblog;
}

/** 处理正文内容标签 */
async function replaceTXT(txt) {
  if(!txt){
    return true;
  }

  // br改成换行
  let br = txt.split('<br />');
  br = br.filter(item => item !== "" && item !== " ");
  console.log('br')
  console.log(br);

  // 去掉头部链接
  let link = txt.split('<a>');
  link = link.filter(item => item !== "" && item !== " " && !item.startsWith('<a') && !item.startsWith(' <a'));
  txt = link.join('');

  // 去掉span标签
  let span = txt.split('<sp');
  span = span.filter(item => !item.startsWith('an'));
  txt = span.join('');

  // 去掉尾部全文链接
  if(txt.includes('全文')){
    txt = txt.substring(0,txt.lastIndexOf('<a href'));
  }

  

  return txt;
}

/** 发送微博内容 */
/**async function sendWeibo(pushID, info, weiboUser, list){
  Bot.logger.mark(`微博推送[${pushID}]`);

  for (let val of list) {
    let msg = buildSendDynamic(weiboUser, val, info);
    if (msg === "can't push transmit") {
      // 这不好在前边判断，只能放到这里了
      continue;
    }
    if (!msg) {
      Bot.logger.mark(`微博动态推送[${pushID}] - [${weiboUser.weiboName}]，推送失败，动态信息解析失败`);
      continue;
    }

    // let sendType = getSendType(info);
    // if (sendType === "merge") {
    msg = await common.replyMake(msg, info.isGroup, msg[0]);
    // }

    if (info.isGroup) {
      Bot.pickGroup(pushID)
        .sendMsg(msg)
        .catch((err) => { // 推送失败，可能仅仅是某个群推送失败
          // dynamicPushFailed.set(pushID, val.id_str);
          // pushAgain(pushID, msg);
        });
    } else {
      common.relpyPrivate(pushID, msg);
    }
    // await common.sleep(BotHaveARest); // 休息一下，别一口气发一堆
  }
  return true;
}*/


/** 构建动态消息 */
/**function buildSendDynamic(weiboUser, dynamic, info) {
  let desc, msg, pics;
  let title = `微博【${weiboUser.weiboName}】动态推送：\n`;

  // 以下对象结构参考米游社接口，接口在顶部定义了
  switch (dynamic.type) {
    case "DYNAMIC_TYPE_AV":
      desc = dynamic?.modules?.module_dynamic?.major?.archive;
      if (!desc) return;

      title = `微博【${weiboUser.weiboName}】视频动态推送：\n`;
      // 视频动态仅由标题、封面、链接组成
      msg = [title, desc.title, segment.image(desc.cover), resetLinkUrl(desc.jump_url)];

      return msg;
    case "DYNAMIC_TYPE_WORD":
      desc = dynamic?.modules?.module_dynamic?.desc;
      if (!desc) return;

      title = `微博【${weiboUser.weiboName}】动态推送：\n`;
      if (getSendType(info) != "default") {
        msg = [title, `${desc.text}\n`, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
      } else {
        msg = [title, `${dynamicContentLimit(desc.text)}\n`, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
      }

      return msg;
    case "DYNAMIC_TYPE_DRAW":
      desc = dynamic?.modules?.module_dynamic?.desc;
      pics = dynamic?.modules?.module_dynamic?.major?.draw?.items;
      if (!desc && !pics) return;

      pics = pics.map((item) => {
        return segment.image(item.src);
      });

      title = `微博【${weiboUser.weiboName}】图文动态推送：\n`;
      
      if (getSendType(info) != "default") {
        msg = [title, `${desc.text}\n`, ...pics, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
      } else {
        if (pics.length > DynamicPicCountLimit) pics.length = DynamicPicCountLimit; // 最多发DynamicPicCountLimit张图，不然要霸屏了
        // 图文动态由内容（经过删减避免过长）、图片、链接组成
        msg = [title, `${dynamicContentLimit(desc.text)}\n`, ...pics, `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`];
      }

      return msg;
    case "DYNAMIC_TYPE_ARTICLE":
      desc = dynamic?.modules?.module_dynamic?.major?.article;
      if (!desc) return;

      pics = [];
      if (desc.covers && desc.covers.length) {
        pics = desc.covers.map((item) => {
          return segment.image(item);
        });
      }

      title = `微博【${weiboUser.weiboName}】文章动态推送：\n`;
      // 专栏/文章动态由标题、图片、链接组成
      msg = [title, desc.title, ...pics, resetLinkUrl(desc.jump_url)];

      return msg;
    case "DYNAMIC_TYPE_FORWARD": // 转发的动态
      let pushTransmit = info.pushTransmit;
      if (!pushTransmit) return "can't push transmit";

      desc = dynamic?.modules?.module_dynamic?.desc;
      if (!desc) return;
      if (!dynamic.orig) return;

      let orig = buildSendDynamic(weiboUser, dynamic.orig, info);
      if (orig && orig.length) {
        // 掐头去尾
        orig.shift();
        orig.pop();
      } else {
        return false;
      }

      title = `微博【${weiboUser.weiboName}】转发动态推送：\n`;
      
      if (getSendType(info) != "default") {
        msg = [
          title,
          `${desc.text}\n---以下为转发内容---\n`,
          ...orig,
          `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`,
        ];
      } else {
        msg = [
          title,
          `${dynamicContentLimit(desc.text, 1, 15)}\n---以下为转发内容---\n`,
          ...orig,
          `${BiliDrawDynamicLinkUrl}${dynamic.id_str}`,
        ];
      }

      return msg;
    case "DYNAMIC_TYPE_LIVE_RCMD":
      desc = dynamic?.modules?.module_dynamic?.major?.live_rcmd?.content;
      if (!desc) return;

      desc = JSON.parse(desc);
      desc = desc?.live_play_info;
      if (!desc) return;

      title = `微博【${weiboUser.weiboName}】直播动态推送：\n`;
      // 直播动态由标题、封面、链接组成
      msg = [title, `${desc.title}\n`, segment.image(desc.cover), resetLinkUrl(desc.link)];

      return msg;
    default:
      Bot.logger.mark(`未处理的微博推送【${weiboUser.weiboName}】：${dynamic.type}`);
      return false;
  }
}*/

// 限制动态字数/行数，避免过长影响观感（霸屏）
/**function dynamicContentLimit(content, lineLimit, lenLimit) {
  content = content.split("\n");

  lenLimit = lenLimit || DynamicContentLenLimit;
  lineLimit = lineLimit || DynamicContentLineLimit;

  if (content.length > lineLimit) content.length = lineLimit;

  let contentLen = 0; // 内容总长度
  let outLen = false; // 溢出 flag
  for (let i = 0; i < content.length; i++) {
    let len = lenLimit - contentLen; // 这一段内容允许的最大长度

    if (outLen) {
      // 溢出了，后面的直接删掉
      content.splice(i--, 1);
      continue;
    }
    if (content[i].length > len) {
      content[i] = content[i].substr(0, len);
      content[i] = `${content[i]}...`;
      contentLen = lenLimit;
      outLen = true;
    }
    contentLen += content[i].length;
  }

  return content.join("\n");
}*/