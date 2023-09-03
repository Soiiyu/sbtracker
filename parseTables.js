import fs from 'fs'

let skillChart   = parseTable('./lib/skyblock_skill_lvl.txt')
let runeChart    = parseTable('./lib/runecrafting.txt')
let socialChart  = parseTable('./lib/social.txt')
let dungeonChart = parseTable('./lib/dungeoneering.txt')

fs.writeFileSync('lib/skill_chart.json', JSON.stringify(skillChart, null, 4))
fs.writeFileSync('lib/runecrafting_chart.json', JSON.stringify(runeChart, null, 4))
fs.writeFileSync('lib/social_chart.json', JSON.stringify(socialChart, null, 4))
fs.writeFileSync('lib/dungeoneering_chart.json', JSON.stringify(dungeonChart, null, 4))


function parseTable(file) {
    return fs.readFileSync(file).toString().split('\n').map(l => {
        let [level, xp, total, reward = 0] = l.replace(/[,\\r]/g, '').split('\t').map(e => parseInt(e))
        return { level, xp, total, reward }
    })
}