import moraBase from './moraBase.js'
import commonTools from './commonTools.js'
import moracfg from './config.js'
import gsCfg from '../../genshin/model/gsCfg.js'
import _ from 'lodash'
import fs from 'node:fs'

const _path = process.cwd()

export default class roleGuide extends moraBase {
  constructor (e) {
    super(e)
    this.url = 'https://bbs-api.mihoyo.com/post/wapi/getPostFullInCollection?&gids=2&order_type=2&collection_id='
    this.oss = '?x-oss-process=image//resize,s_1200/quality,q_90/auto-orient,0/interlace,1/format,jpg'

    this.isSr = this.game === 'sr'
    this.uploader = moracfg.getSetYaml(`${this.game === 'gs' ? 'r' : `${this.game}R`}oleGuides`, true)
    this.resPath = moracfg.getMoraPlus(this.game, 'role')
    this.path = `${moracfg.getMoraPath('data')}roleGuides`
  }

  async strategies (name, isUpdate) {
    let role = gsCfg.getRole(name)
    if (!role) return false

    /** 主角特殊处理 */
    if (commonTools.travelerID.includes(String(role.roleId))) {
      let traveler = commonTools.traveler(role.alias, name, '攻略')
      if (_.isEqual(role.alias, traveler)) {
        role.name = traveler
      } else {
        await this.e.reply(traveler)
        return
      }
    }

    let guide = _.concat(this.uploader.news, this.uploader.olds)
    let res_dir = this.findPack(`${this.resPath}/Guides`, role.name)
    let add_dir = this.findPack(`${this.path}/add_ons`, role.name)
    let dir = this.dirPath(role.name, res_dir, add_dir)

    let msg = [...res_dir]
    let xf = true
    for (let i in dir) {
      let success = true
      if (!fs.existsSync(dir[i]) || (isUpdate && !dir[i].includes('/add_ons/'))) {
        success = await this.getImg(role.name, guide[i], dir[i])
      }
      if (success) {
        if (_.includes(dir[i], `${this.resPath}/Guides`) && _.includes(dir[i], role.name)) {
          xf = false
        }
        if (!xf && _.includes(dir[i], `/1/${role.name}`)) {
          continue
        }
        msg.push(dir[i])
      }
    }

    msg = _.map(_.uniq(msg), v => segment.image(v))
    return await this.replyStrategies(msg, role.name)
  }

  async srStrategies (name, isUpdate) {
    let role = {}

    /** 主角 */
    let trailblazer = commonTools.trailblazer(name, '攻略')
    if (trailblazer) {
      if (!trailblazer.name) {
        await this.e.reply(trailblazer)
        return
      } else role = trailblazer
    }

    if (_.isEmpty(role)) role = gsCfg.getRole(name, '', this.isSr)
    if (!role) return false

    let atlas = `${_path}/plugins/Atlas/star-rail-atlas/guide for role/${role.roleId}.png`
    if (!fs.existsSync(atlas)) {
      atlas = `${_path}/plugins/Atlas/star-rail-atlas/guide for role/${role.name}.png`
    }

    let add_dir = this.findPack(`${this.path}/add_ons`, role.name, this.game)
    let res_dir = this.findPack(`${this.resPath}/Guides`, role.name, this.game)

    let msg = [...res_dir]
    if (fs.existsSync(atlas)) {
      msg.push(atlas)
      this.uploader = _.filter(this.uploader, v => v.source !== '听语惊花')
    }

    let sources = _.map(this.uploader, 'source')
    let dir = _.map(sources, v => `${this.path}/${v}/StarRail/${role.name}.jpg`)

    for (let i in dir) {
      let success = true
      if (!fs.existsSync(dir[i]) || isUpdate) {
        success = await this.getImg(role.name, this.uploader[i], dir[i], (role.reg || ''))
      }
      if (success) msg.push(dir[i])
    }

    msg = _(msg).concat(add_dir).uniq().map(v => segment.image(v)).value()
    return await this.replyStrategies(msg, role.name)
  }

  async zzzStrategies (name, isUpdate) {
    let role = {}

    if (_.isEmpty(role)) role = gsCfg.getRole(name, '', this.isSr, this.game) || {}
    if (_.isEmpty(role) || role?.name === '绮良良') role.name = name

    let add_dir = this.findPack(`${this.path}/add_ons`, role.name, this.game)
    let res_dir = this.findPack(`${this.resPath}/Guides`, role.name, this.game)

    this.uploader = this.uploader.filter(v => !res_dir.find(r => r.includes(v.source)))

    let msg = [...res_dir]
    let atlas = `${_path}/plugins/Atlas/zzz-atlas/角色攻略/${role.name}.png`
    let remove = '新艾利都快讯'
    if (fs.existsSync(atlas) && !res_dir.find(r => r.includes(remove))) {
      msg.push(atlas)
      this.uploader = _.filter(this.uploader, v => v.source !== remove)
    }

    let sources = _.map(this.uploader, 'source')
    let dir = _.map(sources, v => `${this.path}/${v}/ZenlessZoneZero/${role.name}.jpg`)

    for (let i in dir) {
      let success = true
      if (!fs.existsSync(dir[i]) || isUpdate) {
        success = await this.getImg(role.name, this.uploader[i], dir[i], (role.reg || ''))
      }
      if (success) msg.push(dir[i])
    }

    msg = _(msg).concat(add_dir).uniq().map(v => segment.image(v)).value()
    return await this.replyStrategies(msg, role.name)
  }

  async replyStrategies (msg, name) {
    const zones = {
      gs: '原神',
      sr: '星铁',
      zzz: '绝区零'
    }

    if (_.isEmpty(msg)) {
      await this.e.reply(`暂无此角色${zones[this.game]}攻略数据\n前缀符号加了吗？正确吗？角色名正确吗？\n原神攻略发送【#钟离攻略】\n星铁攻略发送【*丹恒攻略】\n绝区零攻略发送【%雨果攻略】`)
      return false
    }

    return await commonTools.makeMsg(this.e, msg, `${name}攻略~`)
  }

  async getHelp () {
    this.resPath += this.isSr ? '/RefStat' : '/YieldCurve'
    await this.checkPath(this.resPath)

    let msg = [segment.image(`file://${this.resPath}/帮助.png`)]
    if (this.isSr) {
      msg.push('请使用【*希儿参考面板】或【#星铁罗刹参考面板】进行使用')
    } else {
      msg.push('角色默认配置：五星0命，四星满命，天赋满级')
      msg.push('曲线详细帮助：\n收益曲线说明书：https://www.miyoushe.com/ys/article/28119112\n《属性收益论》：https://www.miyoushe.com/ys/article/34217426\n《属性收益论》附录：https://www.miyoushe.com/ys/article/35015246')
    }

    return msg
  }

  async stat_curve (name) {
    await this.checkPath(this.resPath)

    let refPath = `${this.resPath}/RefStat`
    let curvePath = `${this.resPath}/YieldCurve`

    let role = {}
    /** 星铁主角特殊处理 */
    if (this.isSr) {
      let trailblazer = commonTools.trailblazer(name, '参考面板')
      if (trailblazer) {
        if (!trailblazer.name) {
          await this.e.reply(trailblazer)
          return
        } else role = trailblazer
      }
    }

    if (_.isEmpty(role)) role = gsCfg.getRole(name, '', this.isSr)
    if (!role) return false
    /** 主角特殊处理 */
    if (commonTools.travelerID.includes(Number(role.roleId))) {
      let traveler = commonTools.traveler(role.alias, name, '进阶参考')
      if (_.isEqual(role.alias, traveler)) {
        role.name = traveler
      } else {
        await this.e.reply(traveler)
        return
      }
    }

    let ref = fs.readdirSync(refPath)
    ref = _.filter(ref, v => _.includes(v, role.name))
    let curve = fs.existsSync(curvePath) ? fs.readdirSync(curvePath) : []
    curve = _.filter(curve, v => _.includes(v, role.name))
    if (_.isEmpty(ref) && _.isEmpty(curve)) {
      await this.e.reply(`暂无${role.name}进阶参考捏`)
      return
    }

    ref = _.map(ref, v => segment.image(`file://${refPath}/${v}`))
    curve = _.map(curve, v => segment.image(`file://${curvePath}/${v}`))
    let msg = [...ref, 'arti', ...curve]

    let notes = this.advancedInfo(role.name)
    let idx = _.findIndex(msg, i => _.isEqual(i, 'arti'))
    msg[idx] = notes.arti ? `圣遗物思路推荐：\n${notes.arti}` : ''
    if (!_.isEmpty(notes?.brief)) msg.push(`【蓝佬小课堂】：\n${notes.brief}`)
    msg[0] = _.compact([msg[0], notes.url])
    msg = _.compact(msg)

    return await commonTools.makeMsg(this.e, msg, `${role.name}进阶参考 @blue菌hehe`)
  }

  // 找本地图片
  findPack (path, name, game = 'gs') {
    const gameDir = {
      gs: '',
      sr: '/StarRail',
      zzz: '/ZenlessZoneZero'
    }
    if (!fs.existsSync(path)) return []
    let _sources = fs.readdirSync(path)
    let dir = []
    _.each(_sources, author => {
      let _author = path.includes('add_ons') ? `${path}/${author}${gameDir[game]}` : `${path}/${author}`
      let _roles = fs.existsSync(_author) ? fs.readdirSync(_author) : []
      _roles = _.filter(_roles, r => _.includes(r, name))
      let au_path = _.isEmpty(_roles) ? false : `${_author}/${_roles[0]}`
      dir.push(au_path)
    })

    dir = _.compact(dir)
    return dir
  }

  /** 路径处理 */
  dirPath (name, res, add) {
    // 适配miaoYZ
    let defpath = `${_path}/temp/strategy/`
    if (!fs.existsSync(defpath)) {
      defpath = `${_path}/data/strategy/`
    }

    let olds = _.map(this.uploader.olds, (v) => v.source)
    let news = _.map(this.uploader.news, (v) => v.source)
    let dir = _.take(fs.readdirSync(defpath), 4)

    let _dir = []
    // news
    _.each(news, (n) => {
      let npath = `${this.path}/${n}/${name}.jpg`
      _.each(res, (r) => {
        if (_.includes(r, n)) {
          npath = r
        }
      })
      _dir.push(npath)
    })
    // olds
    _.each(olds, (o, idx) => {
      let _def = `${defpath}${idx + 1}/${name}.jpg`
      _.each(add, (a) => {
        if (_.includes(a, o)) {
          _def = a
        }
      })
      _dir.push(_def)
    })

    dir = _.concat(_dir, add)
    dir = _.uniq(dir)
    return dir
  }

  advancedInfo (name) {
    let artiRef = moracfg.getfileYaml(`${this.resPath}/RefStat/`, 'RefNotes')
    let arti = artiRef[name] || {}
    let notes = { url: artiRef.url, arti: false }
    if (!_.isEmpty(arti)) {
      notes.arti = `主词条：${arti.mainProp}\n副词条：${arti.viceProp}`
      notes.brief = arti.brief
    }
    return notes
  }

  /**
   * 下载攻略图
   * @param {String} name 角色名
   * @param {Object} author 作者
   */
  async getImg (name, author, sfPath, filter = '') {
    let msyRes = []
    for (const i of author.collection_id) {
      msyRes.push(await commonTools.getFetchData(this.url + i))
    }

    try {
      msyRes = await Promise.all(msyRes)
    } catch (error) {
      logger.error(`米游社接口报错：${error}}`)
      return false
    }

    let posts = _.flatten(_.map(msyRes, item => item.data.posts))
    let url
    let _post = []
    for (let val of posts) {
      /** 攻略图个别来源特殊处理 */
      if (author.collection_id.includes(341523)) {
        if (val.post.structured_content.includes(name + '】')) {
          let content = val.post.structured_content.replace(/\\\/\{\}/g, '')
          // 常驻角色特殊处理
          let pattern = new RegExp(name + '】.*?image\\\\?":\\\\?"(.*?)\\\\?"')
          let imgId = pattern.exec(content)[1]
          url = _.find(val.image_list, v => v.image_id === imgId).url
          break
        }
      } else {
        if (val.post.subject.includes(name)) {
          url = this.getMax(val.image_list)
          break
        } else if (filter) {
          filter = new RegExp(filter)
          if (filter.test(val.post.subject)) {
            url = this.getMax(val.image_list)
            break
          }
        } else if (_.map(val.topics, 'name').includes(name)) {
          _post.push(this.getMax(val.image_list))
        }
      }
    }

    if (!url) {
      if (_.isEmpty(_post)) {
        logger.mark(`暂无${name}攻略（${author.source}）`)
        return false
      } else url = _post[0]
    }

    logger.mark(`${this.e.logFnc} 下载${author.source}-${name}攻略图`)

    if (!await commonTools.download(url + this.oss, sfPath)) return false

    return true
  }

  getMax (imgs) {
    return _.maxBy(imgs, v => Number(v.size)).url
  }

  async checkPath (path) {
    if (!fs.existsSync(path)) {
      await this.e.reply(moracfg.resNotFound, true)
      return false
    }
  }
}
