import moraBase from './moraBase.js'
import commonTools from './commonTools.js'
import moracfg from './config.js'
import gsCfg from '../../genshin/model/gsCfg.js'
import common from '../../../lib/common/common.js'
import _ from 'lodash'
import fs from 'node:fs'

const _path = process.cwd()
export default class roleGuide extends moraBase {
  constructor (e) {
    super(e)
    this.url = 'https://bbs-api.mihoyo.com/post/wapi/getPostFullInCollection?&gids=2&order_type=2&collection_id='
    this.oss = '?x-oss-process=image//resize,s_1200/quality,q_90/auto-orient,0/interlace,1/format,jpg'
    this.game = this.e.game || 'gs'
    this.isSr = this.game === 'sr'
    this.uploader = moracfg.getSetYaml('roleGuides', true)
    this.resPath = moracfg.getMoraPlus(this.game, 'role')
    this.path = `${moracfg.getMoraPath('data')}roleGuides`
  }

  async strategies (name, isUpdate) {
    let role = gsCfg.getRole(name)
    if (!role) return false

    /** 主角特殊处理 */
    if (commonTools.travelerID().includes(String(role.roleId))) {
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
    if (_.isEmpty(msg)) {
      await this.e.reply('暂无攻略数据，请稍后再试')
      return false
    }

    return await common.makeForwardMsg(this.e, msg, `${role.name}攻略`)
  }

  async srStrategies (name, isUpdate) {
    let role = gsCfg.getRole(name, '', this.isSr)
    if (!role) return false
    /** 主角 */
    // let trailblazer = commonTools.trailblazer(name, '攻略')
    this.uploader = moracfg.getSetYaml('srRoleGuides', true)
    let atlas = `${_path}/plugins/Atlas/star-rail-atlas/guide for role/${role.name}.png`

    let add_dir = this.findPack(`${this.path}/add_ons`, role.name, this.isSr)
    let res_dir = this.findPack(`${this.resPath}/Guides`, role.name, this.isSr)
    let sources = _.map(this.uploader, 'source')
    let dir = _.map(sources, (v) => `${this.path}/${v}/StarRail/${role.name}.jpg`)

    let msg = [...res_dir]
    if (fs.existsSync(atlas)) {
      msg.push(atlas)
      this.uploader = _.filter(this.uploader, (v) => v.source !== '听语惊花')
      dir = _.tail(dir)
    }

    for (let i in dir) {
      let success = true
      if (!fs.existsSync(dir[i]) || isUpdate) {
        success = await this.getImg(role.name, this.uploader[i], dir[i])
      }
      if (success) msg.push(dir[i])
    }

    msg = _.map(_.uniq(_.concat(msg, add_dir)), v => segment.image(v))
    if (_.isEmpty(msg)) {
      await this.e.reply('暂无攻略数据，请稍后再试')
      return false
    }

    return await common.makeForwardMsg(this.e, msg, `${role.name}攻略`)
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
      if (!_.isArray(trailblazer)) {
        await this.e.reply(trailblazer)
        return
      }
      if (trailblazer.includes(name)) role.name = name
    }

    if (_.isEmpty(role)) role = gsCfg.getRole(name, '', this.isSr)
    if (!role) return false
    /** 主角特殊处理 */
    if (commonTools.travelerID().includes(String(role.roleId))) {
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

    return msg.length === 1 ? msg[0] : await common.makeForwardMsg(this.e, msg, `${role.name}进阶参考 @blue菌hehe`)
  }

  // 找本地图片
  findPack (path, name, isSr = false) {
    if (!fs.existsSync(path)) return []
    let _sources = fs.readdirSync(path)
    let dir = []
    _.each(_sources, (author) => {
      let _author = isSr && path.includes('add_ons') ? `${path}/${author}/StarRail` : `${path}/${author}`
      let _roles = fs.existsSync(_author) ? fs.readdirSync(_author) : []
      _roles = _.filter(_roles, (r) => _.includes(r, name))
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
    let artiRef = moracfg.getfileYaml(`${this.resPath}/YieldCurve/`, 'RefNotes')
    let url = _.pick(artiRef, 'url')
    let arti = _.pick(artiRef, name)
    arti = arti[name]
    if (_.isEmpty(arti)) {
      return {
        arti: false,
        url: url.url
      }
    } else {
      return {
        arti: `主词条：${arti.mainProp}\n副词条：${arti.viceProp}`,
        brief: arti.brief,
        url: url.url
      }
    }
  }

  /**
   * 下载攻略图
   * @param {String} name 角色名
   * @param {Object} author 作者
   */
  async getImg (name, author, sfPath) {
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

    let posts = _.flatten(_.map(msyRes, (item) => item.data.posts))
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
          for (let image of val.image_list) {
            if (image.image_id == imgId) {
              url = image.url
              break
            }
          }
          break
        }
      } else {
        if (val.post.subject.includes(name)) {
          url = this.getMax(val)
          break
        } else if (_.map(val.topics, 'name').includes(name)) {
          _post.push(this.getMax(val))
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

    if (!await common.downFile(url + this.oss, sfPath)) {
      return false
    }

    logger.mark(`${this.e.logFnc} 下载${author.source}-${name}攻略成功`)

    return true
  }

  getMax (val) {
    let max = 0
    val.image_list.forEach((v, i) => {
      if (Number(v.size) >= Number(val.image_list[max].size)) max = i
    })
    return val.image_list[max].url
  }

  async checkPath (path) {
    if (!fs.existsSync(path)) {
      await this.e.reply(moracfg.resNotFound, true)
      return false
    }
  }
}
