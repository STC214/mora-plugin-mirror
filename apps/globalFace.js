import plugin from '../../../lib/plugins/plugin.js';
import fs from 'node:fs';
import lodash from 'lodash';

let textArr = {}

/**
 * Original from 云崽表情功能
 * Modify by Rrrrrrray
 * 全局表情添加删除操作仅主人能用
 * 覆盖原表情列表功能：
 *  #表情列表 全局表情和本群表情合并显示
 *  #全局表情 照旧
 * * 如不需要此功能在云崽设置里禁用
 */
export class globalFace extends plugin {
  constructor () {
    super ({
      name: '全局表情',
      dsc: '全局表情限制',
      event: 'message',
      priority: 5,
      rule: [
        {
          reg: '^#(全局)?(添加|删除)(.*)',
          fnc: 'globalFace'
        },
        {
          reg: '#(全局)?(表情|词条)(.*)',
          fnc: 'listMeme'
        }
      ]
    })
    this.path = './data/textJson/';
    this.facePath = './data/face/';
    this.isGlobal = false;
  }

  async globalFace () {
    this.isGlobal = this.e?.msg.includes("全局");
    this.isMaster = this.e?.isMaster;

    if (this.isMaster || !this.isGlobal) {
      return false;
    } else {
      this.e.reply('暂无权限，只有主人才能操作');
      return true;
    }
  }
  
  async listMeme () {
    this.isGlobal = this.e?.msg.includes("全局");
    let page = 1;
    let pageSize = 100;
    let type = 'list';

    await this.getGroupId();
    if (!this.group_id) return false;

    this.initTextArr();
    this.initGlobalTextArr();

    let search = this.e.msg.replace(/#|＃|表情|词条|全局/g, '')

    if (search.includes('列表')) {
      page = search.replace(/列表/g, '') || 1
    } else {
      type = 'search'
    }

    let global_list = textArr[Bot.uin];
    let normal_list = textArr[this.group_id];
    let list = this.isGlobal ? global_list : new Map([...global_list, ...normal_list]);

    if (lodash.isEmpty(list)) {
      await this.e.reply('暂无表情')
      return
    }

    let arr = []
    for (let [k, v] of list) {
      if (type == 'list') {
        arr.push({ key: k, val: v, num: arr.length + 1 })
      } else if (k.includes(search)) {
        /** 搜索表情 */
        arr.push({ key: k, val: v, num: arr.length + 1 })
      }
    }

    let count = arr.length
    arr = arr.reverse()

    if (type == 'list') {
      arr = this.pagination(page, pageSize, arr)
    }

    if (lodash.isEmpty(arr)) {
      return
    }

    let msg = []
    let num = 0
    for (let i in arr) {
      if (num >= page * pageSize) break

      let keyWord = await this.keyWordTran(arr[i].key)
      if (!keyWord) continue

      if (Array.isArray(keyWord)) {
        keyWord.unshift(`${arr[i].num}、`)
        keyWord.push('\n')
        keyWord.forEach(v => msg.push(v))
      } else if (keyWord.type) {
        msg.push(`\n${arr[i].num}、`, keyWord, '\n\n')
      } else {
        msg.push(`${arr[i].num}、${keyWord}\n`)
      }
      num++
    }

    let end = ''
    if (type == 'list' && count > 100) {
      end = `更多内容请翻页查看\n如：#表情列表${Number(page) + 1}`
    }

    let title = `表情列表，第${page}页，共${count}条`
    if (type == 'search') {
      title = `表情${search}，${count}条`
    }

    let forwardMsg = await this.makeForwardMsg(Bot.uin, title, msg, end)

    this.e.reply(forwardMsg)
  }

  /** 群号key */
  get grpKey () {
    return `Yz:group_id:${this.e.user_id}`
  }
  /** 获取群号 */
  async getGroupId () {
    
    /** 添加全局表情，存入到机器人qq文件中 */
    if (this.isGlobal) {
      this.group_id = Bot.uin;
      return Bot.uin;
    }
    
    if (this.e.isGroup) {
      this.group_id = this.e.group_id
      redis.setEx(this.grpKey, 3600 * 24 * 30, String(this.group_id))
      return this.group_id
    }

    // redis获取
    let groupId = await redis.get(this.grpKey)
    if (groupId) {
      this.group_id = groupId
      return this.group_id
    }

    return false
  }

  /** 初始化已添加内容 */
  initTextArr () {
    if (textArr[this.group_id]) return

    textArr[this.group_id] = new Map()

    let path = `${this.path}${this.group_id}.json`
    if (!fs.existsSync(path)) {
      return
    }

    try {
      let text = JSON.parse(fs.readFileSync(path, 'utf8'))
      for (let i in text) {
        if (text[i][0] && !Array.isArray(text[i][0])) {
          text[i] = [text[i]]
        }

        textArr[this.group_id].set(String(i), text[i])
      }
    } catch (error) {
      logger.error(`json格式错误：${path}`)
      delete textArr[this.group_id]
      return false
    }

    /** 加载表情 */
    let facePath = `${this.facePath}${this.group_id}`

    if (fs.existsSync(facePath)) {
      const files = fs.readdirSync(`${this.facePath}${this.group_id}`).filter(file => /\.(jpeg|jpg|png|gif)$/g.test(file))
      for (let val of files) {
        let tmp = val.split('.')
        tmp[0] = tmp[0].replace(/_[0-9]{10}$/, '')
        if (/at|image/g.test(val)) continue

        if (textArr[this.group_id].has(tmp[0])) continue

        textArr[this.group_id].set(tmp[0], [[{
          local: `${facePath}/${val}`,
          asface: true
        }]])
      }

      this.saveJson()
    } else {
      fs.mkdirSync(facePath)
    }
  }

  /** 初始化全局已添加内容 */
  initGlobalTextArr() {
    if (textArr[Bot.uin]) return;

    textArr[Bot.uin] = new Map();

    let globalPath = `${this.path}${Bot.uin}.json`;
    if (!fs.existsSync(globalPath)) {
      return;
    }

    try {
      let text = JSON.parse(fs.readFileSync(globalPath, "utf8"));

      for (let i in text) {
        if (text[i][0] && !Array.isArray(text[i][0])) {
          text[i] = [text[i]];
        }
        textArr[Bot.uin].set(String(i), text[i]);
      }
    } catch (error) {
      logger.error(`json格式错误：${globalPath}`);
      delete textArr[Bot.uin];
      return false;
    }

    /** 加载表情 */
    let globalFacePath = `${this.facePath}${Bot.uin}`;

    if (fs.existsSync(globalFacePath)) {
      const files = fs
        .readdirSync(`${this.facePath}${Bot.uin}`)
        .filter((file) => /\.(jpeg|jpg|png|gif)$/g.test(file));

      for (let val of files) {
        let tmp = val.split(".");
        tmp[0] = tmp[0].replace(/_[0-9]{10}$/, "");
        if (/at|image/g.test(val)) continue;

        if (textArr[Bot.uin].has(tmp[0])) continue;

        textArr[Bot.uin].set(tmp[0], [
          [
            {
              local: `${globalFacePath}/${val}`,
              asface: true,
            },
          ],
        ]);
      }

      this.saveGlobalJson();
    } else {
      fs.mkdirSync(globalFacePath);
    }
  }

  saveJson () {
    let obj = {}
    for (let [k, v] of textArr[this.group_id]) {
      obj[k] = v
    }

    fs.writeFileSync(`${this.path}${this.group_id}.json`, JSON.stringify(obj, '', '\t'))
  }
  
  saveGlobalJson() {
    let obj = {};
    for (let [k, v] of textArr[Bot.uin]) {
      obj[k] = v;
    }

    fs.writeFileSync(
      `${this.path}${Bot.uin}.json`,
      JSON.stringify(obj, "", "\t")
    );
  }

  async makeForwardMsg (qq, title, msg, end = '') {
    let nickname = Bot.nickname
    if (this.e.isGroup) {
      let info = await Bot.getGroupMemberInfo(this.e.group_id, qq)
      nickname = info.card ?? info.nickname
    }
    let userInfo = {
      user_id: Bot.uin,
      nickname
    }

    let forwardMsg = [
      {
        ...userInfo,
        message: title
      }
    ]

    let msgArr = lodash.chunk(msg, 40)
    msgArr.forEach(v => {
      v[v.length - 1] = lodash.trim(v[v.length - 1], '\n')
      forwardMsg.push({ ...userInfo, message: v })
    })

    if (end) {
      forwardMsg.push({ ...userInfo, message: end })
    }

    /** 制作转发内容 */
    if (this.e.isGroup) {
      forwardMsg = await this.e.group.makeForwardMsg(forwardMsg)
    } else {
      forwardMsg = await this.e.friend.makeForwardMsg(forwardMsg)
    }

    /** 处理描述 */
    forwardMsg.data = forwardMsg.data
      .replace(/\n/g, '')
      .replace(/<title color="#777777" size="26">(.+?)<\/title>/g, '___')
      .replace(/___+/, `<title color="#777777" size="26">${title}</title>`)

    return forwardMsg
  }

  /** 分页 */
  pagination (pageNo, pageSize, array) {
    let offset = (pageNo - 1) * pageSize
    return offset + pageSize >= array.length ? array.slice(offset, array.length) : array.slice(offset, offset + pageSize)
  }

  /** 关键词转换成可发送消息 */
  async keyWordTran (msg) {
    /** 图片 */
    if (msg.includes('{image')) {
      let tmp = msg.split('{image')
      if (tmp.length > 2) return false

      let md5 = tmp[1].replace(/}|_|:/g, '')

      msg = segment.image(`http://gchat.qpic.cn/gchatpic_new/0/0-0-${md5}/0`)
      msg.asface = true
    } else if (msg.includes('{at:')) {
      let tmp = msg.match(/{at:(.+?)}/g)

      for (let qq of tmp) {
        qq = qq.match(/[1-9][0-9]{4,14}/g)[0]
        let member = await await Bot.getGroupMemberInfo(this.group_id, Number(qq)).catch(() => { })
        let name = member?.card ?? member?.nickname
        if (!name) continue
        msg = msg.replace(`{at:${qq}}`, `@${name}`)
      }
    } else if (msg.includes('{face')) {
      let tmp = msg.match(/{face(:|_)(.+?)}/g)
      if (!tmp) return msg
      msg = []
      for (let face of tmp) {
        let id = face.match(/\d+/g)
        msg.push(segment.face(id))
      }
    }

    return msg
  }
}