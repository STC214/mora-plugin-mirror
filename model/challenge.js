import moraBase from './moraBase.js'
import moracfg from './config.js'
import fs from 'node:fs'
import _ from 'lodash'
import commonTools from './commonTools.js'

export default class challenge extends moraBase {
  constructor (e) {
    super(e)
    this.model = 'challenge'
    this.path = moracfg.getGameRes('cha')
  }

  async challenges (abyss, version) {
    if (!this.checkPlus(this.path)) return false
    if (this.game === 'zzz') {
      await this.e.reply('暂不支持绝区零')
      return false
    }

    const regList = {
      abyss: { reg: /(深渊|深境(螺旋)?)$/, name: '深渊' },
      combat: { reg: /(幻想真境|真境)?剧诗$/, name: '剧诗' },
      hard: { reg: /(幽(境|镜)|危战)$/, name: '幽境' },
      chaos: { reg: /(忘却(之庭)?|混沌(回忆)?)$/, name: '混沌' },
      story: { reg: /(构事|虚构|叙事)$/, name: '虚构' },
      boss: { reg: /(末日幻影|幻影)$/, name: '末日' }
    }

    if (abyss === '深渊' && this.game === 'sr') abyss = '混沌'

    let name = ''
    for (const type in regList) {
      if (!regList[type].reg.test(abyss)) continue

      abyss = type
      name = regList[type].name
      break
    }

    let pics = []
    let resPath = `${moracfg.getMoraPlus(this.game, abyss)}/Version/${version}`
    if (fs.existsSync(resPath)) pics = fs.readdirSync(resPath)
    else resPath = `${moracfg.getMoraPath('data')}Challenges/${this.game}/${abyss}/`

    if (!pics.length) {
      if (!fs.existsSync(resPath)) fs.mkdirSync(resPath, { recursive: true })

      const infos = moracfg.getfileYaml(`${this.path}/`, abyss)
      const versions = _.keys(infos).filter(v => v.includes(version))
      if (versions.length) {
        resPath += version

        for (const ver of versions) {
          const file = `${ver}v${infos[ver].version}.png`
          const sfPath = `${resPath}/${file}`
          if (!fs.existsSync(sfPath)) {
            logger.mark(`${this.e.logFnc} 下载${this.game}-${ver}`)
            const img = await commonTools.download(`https://homdgcat.wiki/Abyss/CH/${ver}.png`, sfPath)
            if (!img) continue
          }
          pics.push(file)
        }
      }
    }

    if (_.isEmpty(pics)) {
      logger.error('暂无此版本')
      return false
    }

    const msg = pics.map(v => segment.image(`file://${resPath}/${v}`))
    return await commonTools.makeMsg(this.e, msg, `${this.game === 'sr' ? '星铁' : '原神'}${version}${name}`)
  }
}
