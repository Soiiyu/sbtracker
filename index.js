import fs from 'fs'
import fetch from 'node-fetch'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

if(!fs.existsSync('config.json')) {
    fs.copyFileSync('./lib/default-config.json', './config.json')
    console.log('New config.json file generated\nPlease fill it out before running again!')
    process.exit(1)
}
const config = JSON.parse(fs.readFileSync('config.json'))
const api = 'https://api.hypixel.net/skyblock/profiles'

const skillChart = JSON.parse(fs.readFileSync('lib/skill_chart.json'))
const runeChart = JSON.parse(fs.readFileSync('lib/runecrafting_chart.json'))
const socialChart = JSON.parse(fs.readFileSync('lib/social_chart.json'))
const dungeonChart = JSON.parse(fs.readFileSync('lib/dungeoneering_chart.json'))
const collections = JSON.parse(fs.readFileSync('lib/collections.json'))
const slayerChart = JSON.parse(fs.readFileSync('lib/slayer_chart.json'))

const helpMsg = fs.readFileSync('lib/help.txt', 'utf-8')


// console.log(getURL({key: config.key, uuid: config.uuid}))
const { key, uuid, profile } = config

switch (process.argv[2]?.toLowerCase()) {
    case 'lvl':
        let xp = process.argv[3] ?? null;
        if (isNaN(xp)) console.log('use numbers')
        else {
            let lvl = getLVL(process.argv[3] ?? null, skillChart, 60)
            console.log(`${commaNum(xp)}xp\nLVL: ${lvl.level}\nProgress ${(lvl.nextLVL ? (100 * lvl.progress / lvl.nextLVL).toFixed(2) + `%   (${commaNum(lvl.progress)}/${commaNum(lvl.nextLVL)})` : commaNum(lvl.progress + lvl.total))}`)
        }
        break
    case 'nextlvl':
        toXlvl('./data/Soiiy_Mango', process.argv[3] ?? null, process.argv[4] ?? 60, process.argv[5] ?? null)
        break
    case 'compare':
        compareStats('./data/Soiiy_Mango', process.argv[3] ?? null)
        break
    case 'refilter':
        reFilter()
        break
    case 'stats':
        let name = 'Soiiy'
        fetch(getURL({ key, uuid })).then(res => { console.log(res); return res.json() }).then(data => {
            let profileData = data.profiles.find(p => p.cute_name.toLowerCase() == profile.toLowerCase())
            let player = profileData.members[uuid]

            let filtered = filterData(player, profileData)

            let nDate = new Date()
            let date = [nDate.getFullYear(), (nDate.getMonth() + 1).toString().padStart(2, '0'), nDate.getDate().toString().padStart(2, '0')].join('_')
            data.date = { text: date, time: nDate.getTime() }
            filtered.date = { text: date, time: nDate.getTime() }
            let dir = `/data/${name}_${profileData.cute_name}`

            if (!fs.existsSync(__dirname + dir)) fs.mkdirSync(__dirname + dir)
            fs.writeFileSync(`.${dir}/filtered_${date}.json`, JSON.stringify(filtered, null, 4))
            fs.writeFileSync(`.${dir}/data_${date}.json`, JSON.stringify(data, null, 4))

            compareStats('.' + dir)

        })
        break
    default:
        console.log(helpMsg)
    // fetch(`https://api.mojang.com/user/profiles/${uuid}/names`).then(res => res.json()).then(names => {
    //     let name = names[names.length - 1].name
    //     fetch(getURL({ key, uuid })).then(res => res.json()).then(data => {
    //         let profileData = data.profiles.find(p => p.cute_name.toLowerCase() == profile.toLowerCase())
    //         let player = profileData.members[uuid]

    //         let filtered = filterData(player, profileData)

    //         let nDate = new Date()
    //         let date = [nDate.getFullYear(), (nDate.getMonth() + 1).toString().padStart(2, '0'), nDate.getDate().toString().padStart(2, '0')].join('_')
    //         data.date = { text: date, time: nDate.getTime() }
    //         filtered.date = { text: date, time: nDate.getTime() }
    //         let dir = `/data/${name}_${profileData.cute_name}`

    //         if (!fs.existsSync(__dirname + dir)) fs.mkdirSync(__dirname + dir)
    //         fs.writeFileSync(`.${dir}/filtered_${date}.json`, JSON.stringify(filtered, null, 4))
    //         fs.writeFileSync(`.${dir}/data_${date}.json`, JSON.stringify(data, null, 4))

    //         compareStats('.' + dir)

    //     })
    // })
}

// compareStats('./data/Soiiy_Mango')
function toXlvl(dir, skill, lvl = 60, ph) {
    let files = fs.readdirSync(dir).filter(f => f.includes('filtered'))
    let filteredFiles = files.map(f => JSON.parse(fs.readFileSync(dir + '/' + f))).sort((a, b) => b.date.time - a.date.time)
    if (filteredFiles.length > 1) {
        let skills = filteredFiles[0].skills
        if (skill == null || !skills[skill?.toLowerCase()]) return console.log(`usage: node . nextlvl <skill> <?lvl> <?xp per hour>\nSkill list: ${Object.keys(skills).join(', ')}`)
        skill = skill.toLowerCase()
        let currChart = skill == 'runecrafting' ? runeChart : skillChart;
        lvl = lvl > currChart[currChart.length - 1].level ? currChart[currChart.length - 1].level : parseInt(lvl)

        let diff = currChart[lvl].total - (skills[skill].total + skills[skill].progress)
        console.log(`Your ${skill} LVL - ${skills[skill].level}`)
        let p = diff < 0
        console.log(`${p ? 'You are over LVL' : 'You will reach LVL'} ${lvl} ${p ? 'by' : 'in'} ${commaNum(Math.abs(diff))}xp`)
        if (ph) {
            let hr = diff / parseFloat(ph)
            let min = Math.round(60 * (hr - Math.floor(hr)))
            console.log(`Which ${p ? 'took' : 'will take'} ${Math.floor(Math.abs(hr)).toString().padStart(2, '0')}h ${min.toString().padStart(2, '0')}m`)
        }
    }
}

function compareStats(dir, last = false) {
    let files = fs.readdirSync(dir).filter(f => f.includes('filtered'))
    let filteredFiles = files.map(f => JSON.parse(fs.readFileSync(dir + '/' + f))).sort((a, b) => b.date.time - a.date.time)
    if (filteredFiles.length > 1) {

        let [curr, prev] = filteredFiles
        if (last) {
            const userDate = Date.parse(last)
            prev = filteredFiles.filter((data) => data.date.time >= userDate)
            prev = prev[prev.length - 1]
            if (!prev) return console.log('No data found, or bad date format (use yyyy-mm-dd)')
        }
        let differences = {
            skills: Object.entries(curr.skills).map(([skill, xp]) => {
                let p = prev.skills[skill]
                let lvlDiff = xp.level - p.level
                let xpDiff = (xp.total + xp.progress) - (p.total + p.progress)
                // if (lvlDiff !== 0) acc.push(`${skill} level +${Math.round(lvlDiff)} (${Math.round(xp.level)})`)
                // if (xpDiff !== 0) acc.push(`${skill} xp +${Math.round(xpDiff)} (${Math.round(xp.total + xp.progress)})`)

                return xpDiff !== 0 ? `${skill}[${xp.level}${lvlDiff !== 0 ? ` +${lvlDiff}` : ''}] +${commaNum(Math.round(xpDiff))} (${xp.nextLVL ? `${((xp.progress / xp.nextLVL) * 100).toFixed(2)}% - ${commaNum(Math.round(xp.progress))}/${commaNum(Math.round(xp.nextLVL))}` : `${commaNum(Math.round(xp.total + xp.progress))} +${commaNum(Math.round(xp.progress))}`})` : ''
                // return acc.join('\n')
            }),
            miscStats: Object.entries(curr.miscStats).map(([stat, val]) => {
                let diff = val - prev.miscStats[stat]
                return diff !== 0 ? `${stat} +${diff} (${val})` : ''
            }),
            coins: [0].map(() => {
                let diff = (curr.coins.coin_purse + curr.coins.bank) - (prev.coins.coin_purse + prev.coins.bank)
                return `${diff >= 0 ? '+' : ''}${commaNum(Math.round(diff))} (${commaNum(Math.round(curr.coins.coin_purse + curr.coins.bank))})`
            }),
            slayers: Object.entries(curr.slayers).map(([slayer, data]) => {
                const p = prev.slayers[slayer] ?? { level: 0, xp: 0, kills: [] }
                const lvlDiff = data.level - p.level
                const xpDiff = data.xp - p.xp
                const killDiff = data.kills.map((tier, i) => {
                    let out
                    if (p.kills[i]) {
                        const kDiff = tier - p.kills[i]
                        out = kDiff !== 0 ? `t${i + 1}: +${kDiff}` : ''
                    } else out = ''
                    return out
                })
                    .filter(tier => tier !== '')
                    .join(', ')

                return xpDiff !== 0 ?
                    `${slayer}[${data.level}${lvlDiff !== 0 ? ` +${lvlDiff}` : ''}] +${commaNum(xpDiff)} (${data.nextLVL ? `${((data.xp / data.nextLVL) * 100).toFixed(2)}% - ${commaNum(data.xp)}/${commaNum(data.nextLVL)}` : commaNum(data.xp)})    ${killDiff}` :
                    ''
            }),
            dungeons: [],      // to be added, idc about these atm
            mining: Object.entries(curr.mining.powder).map(([powder, amount]) => {
                let diff = amount - prev.mining.powder[powder]
                return diff !== 0 ? `${powder.replace('_total', ' powder')} +${commaNum(diff)} (${commaNum(amount)})` : ''
            }),
            collections: Object.entries(curr.collections).map(([col, val]) => {
                let diff = val - prev.collections[col]
                return { text: diff !== 0 ? `${collections[col]}:   +${commaNum(diff)} (${commaNum(val)})` : '', value: diff }
            }).sort((a, b) => b.value - a.value).map(({ text }) => text)
        }

        console.log(`difference from ${curr.date.text} - ${prev.date.text}`.replace(/\_/g, '-'))
        Object.entries(differences).forEach(([category, lvlups]) => {
            lvlups = lvlups.filter(s => s != '')
            if (lvlups.length > 0) console.log(`\n---${category}---\n${lvlups.join('\n')}`)
        })
    }
}

function filterData(player, profile) {
    let { stats, slayer_bosses, mining_core } = player
    let dungeons = player.dungeons.dungeon_types
    let currentCollection = {}
    Object.entries(collections).forEach(([col, val]) => {
        currentCollection[col] = player.collection[col]
    })

    const slayers = {}
    Object.entries(slayer_bosses).forEach(([slayer, data]) => {
        const { level, progress, nextLVL } = getSlayerLVL(slayer, data.xp)
        slayers[slayer] = {
            level,
            progress,
            nextLVL,
            xp: data.xp,
            kills: Object.keys(data).filter(key => key.includes('boss_kills_tier')).map((tier, i, array) => array[tier.split('_').slice(-1)] = data[tier])
        }
    })

    let filtered = {
        skills: {
            farming: getLVL(player.experience_skill_farming, skillChart, 60),
            mining: getLVL(player.experience_skill_mining, skillChart, 60),
            combat: getLVL(player.experience_skill_combat, skillChart, 60),
            foraging: getLVL(player.experience_skill_foraging, skillChart),
            fishing: getLVL(player.experience_skill_fishing, skillChart),
            enchating: getLVL(player.experience_skill_enchanting, skillChart, 60),
            alchemy: getLVL(player.experience_skill_alchemy, skillChart),
            carpentry: getLVL(player.experience_skill_carpentry, skillChart),
            runecrafting: getLVL(player.experience_skill_runecrafting, runeChart, 25),
            social: getLVL(player.experience_skill_social2, socialChart),
            taming: getLVL(player.experience_skill_taming, skillChart)
        },
        miscStats: {
            kills: stats.kills,
            deaths: stats.deaths,
            magical_power: player.accessory_bag_storage?.highest_magical_power ?? 0
        },
        coins: {
            coin_purse: player.coin_purse,
            bank: profile.banking.balance
        },
        slayers,
        dungeons: {
            catcombs: {
                xp: getLVL(dungeons.catacombs.experience, dungeonChart),
                floor_completions: dungeons.catacombs.tier_completions,

            },
            master_catacombs: {
                floor_completions: dungeons.master_catacombs.tier_completions
            },
            essence: {
                undead: player.essence_undead,
                diamond: player.essence_diamond,
                dragon: player.essence_dragon,
                gold: player.essence_gold,
                ice: player.essence_ice,
                wither: player.essence_wither,
                spider: player.essence_spider
            }
        },
        jacob: {
            unique_golds: player.jacob2.unique_golds2
        },
        mining: {
            powder: {
                mithril_total: mining_core.powder_mithril + mining_core.powder_spent_mithril,
                gemstone_total: mining_core.powder_gemstone + mining_core.powder_spent_gemstone
            }
        },
        collections: currentCollection

    }


    return filtered
}

function getLVL(n, chart, cap = 50) {
    if (isNaN(n)) return 'Use numbers'

    let index = 0
    let out;
    let totalLVLs = cap + 1

    while (index < totalLVLs && n >= chart[index].total) {
        let { level, xp, total } = chart[index]
        let progress = n - total
        out = { level, xp, progress, total }
        index++
    }
    out.nextLVL = out.level < totalLVLs - 1 ? chart[out.level + 1].xp : null
    return out
}

function getSlayerLVL(type, xp) {
    const chart = slayerChart[type]

    const out = {
        level: 0,
        progress: 0,
        nextLVL: null
    }
    for (let i = chart.length - 1; i >= 0; i--) {
        if (xp >= chart[i]) {
            out.level = i + 1
            if (out.nextLVL) {
                out.progress = out.nextLVL - xp
            }
            break
        }
        out.nextLVL = chart[i]
    }

    return out
}

function getURL(options) {
    const url = `${api}?${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('&')}`
    console.log(url)
    return url
}

function reFilter() {
    let data = fs.readdirSync('./data')
    data.filter(f => !f.includes('BU')).forEach(prof => {
        let allData = fs.readdirSync(`./data/${prof}`)
        allData.filter(f => f.includes('data')).forEach(file => {
            let fileData = JSON.parse(fs.readFileSync(`./data/${prof}/${file}`))
            let profileData = fileData.profiles.find(p => p.cute_name.toLowerCase() == profile.toLowerCase())
            let player = profileData.members[uuid]

            let filtered = filterData(player, profileData)

            let dir = `/data/${prof}`
            filtered.date = fileData.date
            fs.writeFileSync(`.${dir}/filtered_${fileData.date.text}.json`, JSON.stringify(filtered, null, 4))

        })
    })
}

function commaNum(n) {
    let nr = Math.floor(n)
    let dec = (n % nr).toFixed(2)
    return nr.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + (dec != 0 ? dec.substring(1) : '')
}