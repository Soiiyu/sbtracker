import fs from 'fs'
import nbt from 'nbt'
let dir = './data/Soiiy_Mango'
const config = JSON.parse(fs.readFileSync('config.json'))
let { key, uuid, profile } = config
let files = fs.readdirSync(dir).filter(f => f.includes('data'))
let filteredFiles = files.map(f => JSON.parse(fs.readFileSync(dir + '/' + f))).sort((a, b) => b.date.time - a.date.time)

let minRecom = 'LEGENDARY'
if(!minRecom) minRecom = 'SPECIAL'

let MpTable = {
    MYTHIC: 22,
    LEGENDARY: 16,
    EPIC: 12,
    RARE: 8,
    UNCOMMON: 5,
    COMMON: 3,
    "VERY SPECIAL": 5,
    SPECIAL: 3
}

let profileData = filteredFiles[0].profiles.find(p => p.cute_name.toLowerCase() == profile.toLowerCase())
let player = profileData.members[uuid]


nbt.parse(Buffer.from(player.talisman_bag.data, 'base64'), (err, data) => {
    if(err) {throw err}
    fs.writeFileSync('./talis.json', JSON.stringify(data, null, 4))

    let accessories = data.value.i.value.value.map(d => parseAccessory(d.tag.value))
    // const accessories = data.map(({tag}) => parseAccessory(tag.value))
    let noRecom = JSON.parse(JSON.stringify(accessories)).map(talis => {
        if (talis.recom) talis.rarity = Object.keys(MpTable)[Object.keys(MpTable).indexOf(talis.rarity) + 1]
        return talis
    })
    let fullRecom = JSON.parse(JSON.stringify(accessories)).map(talis => {
        let rarityIndex = Object.keys(MpTable).indexOf(talis.rarity)
        if (!talis.recom && rarityIndex <= Object.keys(MpTable).indexOf(minRecom)) {
            talis.rarity = Object.keys(MpTable)[rarityIndex - 1]
            talis.recom = true
        }
        return talis
    })
    console.log(`Total Recombed - ${accessories.filter(({recom}) => recom).length}/${accessories.length}`)
    console.log(`Live        • ${calcMP(accessories)}mp`)
    console.log(`No Recomb   • ${calcMP(noRecom)}mp`)
    console.log(`Full Recomb • ${calcMP(fullRecom)}mp${minRecom ? ` x${fullRecom.filter(({recom}) => recom).length}` : ''}`)

})


function parseAccessory(value) {
    let {Name, Lore} = value.display.value
    let accessory = {
        name: Name.value.substr(2),
        color: Name.value.substr(0,2),
        rarity: Lore.value.value[Lore.value.value.length - 1].replace(/(§ka|§\w)/g, '').replace(/(ACCESSORY|HATCCESSORY|DUNGEON)/g, '').trim(),
        recom: Lore.value.value[Lore.value.value.length - 1].match(/§ka/) ? true : false
    }
    return accessory
}

function calcMP(acc) {
    // console.log(acc)
    return acc.reduce((mp, {rarity}) => mp + MpTable[rarity], 0)
}