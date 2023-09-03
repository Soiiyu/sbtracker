// Old code
import fs from 'fs'
import fetch from 'node-fetch'
import { fileURLToPath } from 'url'
import { dirname } from 'path'
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const config = JSON.parse(fs.readFileSync('config.json'))
const api = 'https://api.hypixel.net/skyblock/profiles'

let skillChart = JSON.parse(fs.readFileSync('skill_chart.json'))
let runeChart = JSON.parse(fs.readFileSync('runecrafting_chart.json'))
let socialChart = JSON.parse(fs.readFileSync('social_chart.json'))
let dungeonChart = JSON.parse(fs.readFileSync('dungeoneering_chart.json'))

let collections = JSON.parse(fs.readFileSync('collections.json'))



// console.log(getURL({key: config.key, uuid: config.uuid}))
let { key, uuid, profile } = config

switch (process.argv[2]?.toLowerCase()) {
    case 'compare':
        compareStats('./data/Soiiy_Mango', process.argv[3] ?? null)
        break
    case 'refilter':
        reFilter()
        break
    default:
        fetch(`https://api.mojang.com/user/profiles/${uuid}/names`).then(res => res.json()).then(names => {
            let name = names[names.length - 1].name
            fetch(getURL({ key, uuid })).then(res => res.json()).then(data => {
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
        })
}

// compareStats('./data/Soiiy_Mango')


function compareStats(dir, last = false) {
    let files = fs.readdirSync(dir).filter(f => f.includes('filtered'))
    let filteredFiles = files.map(f => JSON.parse(fs.readFileSync(dir + '/' + f))).sort((a, b) => b.date.time - a.date.time)
    if (filteredFiles.length > 1) {
        // fs.writeFileSync(`${dir}/data_list.json`, JSON.stringify(files))

        let [curr, prev] = filteredFiles
        if(last) prev = filteredFiles[filteredFiles.length - 1]
        let differences = {
            skills: Object.entries(curr.skills).map(([skill, xp]) => {
                //mining[60] +10238xp (117974555)
                //farming[35^]
                let acc = []
                let p = prev.skills[skill]
                let lvlDiff = xp.level - p.level
                let xpDiff = (xp.total + xp.progress) - (p.total + p.progress)
                if (lvlDiff !== 0) acc.push(`${skill} level +${Math.round(lvlDiff)} (${Math.round(xp.level)})`)
                if (xpDiff !== 0) acc.push(`${skill} xp +${Math.round(xpDiff)} (${Math.round(xp.total + xp.progress)})`)

                return acc.join('\n')
            }),
            miscStats: Object.entries(curr.miscStats).map(([stat, val]) => {
                let diff = val - prev.miscStats[stat]
                return diff !== 0 ? `${stat} +${diff} (${val})` : ''
            }),
            coins: [0].map(() => {
                let diff = (curr.coins.coin_purse + curr.coins.bank) - (prev.coins.coin_purse + prev.coins.bank)
                return `${diff >= 0 ? '+' : ''}${Math.round(diff)} (${Math.round(curr.coins.coin_purse + curr.coins.bank)})`
            }),
            slayer_bosses: [], // to be added, idc about these atm
            dungeons: [],      // ^^
            mining: Object.entries(curr.mining.powder).map(([powder, amount]) => {
                let diff = amount - prev.mining.powder[powder]
                return diff !== 0 ? `${powder.replace('_total', ' powder')} +${diff} (${amount})` : ''
            }),
            collections: Object.entries(curr.collections).map(([col, val]) => {
                let diff = val - prev.collections[col]
                return {text: diff !== 0 ? `${collections[col]} +${diff} (${val})` : '', value: diff}
            }).sort((a, b) => b.value - a.value).map(({text}) => text)
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
            taming: getLVL(player.experience_skill_taming, skillChart)
        },
        miscStats: {
            kills: stats.kills,
            deaths: stats.deaths
        },
        coins: {
            coin_purse: player.coin_purse,
            bank: profile.banking.balance
        },
        slayer_bosses,
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

function getURL(options) {
    return `${api}?${Object.entries(options).map(([key, val]) => `${key}=${val}`).join('&')}`
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