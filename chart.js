import express from 'express'
import fs from 'fs'
const app = express()
const port = require('./config.json')?.chart_port

if(!port) {
    console.log('Please generate a config.json file by running `node .` and fill it out')
    process.exit(1)
}

let dir = 'data/Soiiy_Mango'
// app.get('/', (req, res) => {
//   res.send('Hello World!<br>hi')
// })

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})

app.use(express.static('public'))

app.get('/data', (req, res) => {
    let charts = {
        skills: null,
        coins: null,
        mining: null,
        collections: null,
        miscStats: null
    }
    let labels;
    let files = fs.readdirSync(dir).filter(f => f.includes('filtered'))
    let filteredFiles = files.map(f => JSON.parse(fs.readFileSync(dir + '/' + f))).sort((a, b) => a.date.time - b.date.time)
    if (filteredFiles.length > 1) {
        labels = filteredFiles.reduce((acc, {date}) => ([...acc, date.text.replace(/\_/g, '-')]), [])
        let skillDataset = filteredFiles.reduce((acc, {skills}) => {
            Object.entries(skills).map(([skill, xp]) => {
                if(!acc[skill]) acc[skill] = []
                acc[skill].push(Math.round(xp.progress + xp.total))
            })
            return acc
        }, {})
        charts.skills = Object.entries(skillDataset).map(([skill, xp]) => makeDataset(skill, xp))

        let coinsDataset = filteredFiles.map(({coins}) => Math.round(coins.coin_purse + coins.bank))
        charts.coins = [makeDataset('coins', coinsDataset)]

        let miningDataset = filteredFiles.reduce((acc, {mining}) => {
            Object.entries(mining.powder).map(([type, powder]) => {
                if(!acc[type]) acc[type] = []
                acc[type].push(Math.round(powder))
            })
            return acc
        }, {})
        charts.mining = Object.entries(miningDataset).map(([type, powder]) => makeDataset(type, powder))
    }
    console.log(charts)
    res.json({charts, labels})
})

function makeDataset(label, data, color) {
    return {
        label,
        data,
        backgroundColor: 'rgb(255, 99, 132)',
        borderColor: 'rgb(255, 99, 132)'
    }
}