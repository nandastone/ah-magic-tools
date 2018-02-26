#!/usr/bin/env node

const program = require('commander')
const csv = require('csvtojson')
const _ = require('lodash')

const packageJson = require('./package.json')
const INVTYPE_NON_EQUIP = 0
const BONDING_BIND_ON_PICKUP = 1
const BONDING_BIND_ON_EQUIP = 2
const BONDING_BIND_ON_USE = 3
const BONDING_QUEST = 3

let fileArg = ''

program
  .version(packageJson.version)
  .usage('[options] <file>')
  .option('--equip-only', 'Only export items that are equipable.')
  .option('--min-quality [quality]', 'Minimum item quality.')
  .option('--tradable-only', 'Only export items that are tradable (BOE, BOU).')
  .option('--json', 'Output as JSON.')
  .action(file => fileArg = file)

program.parse(process.argv)

if (!fileArg) {
  console.error('No item CSV file provided!')
  process.exit(1)
}

const items = []

csv()
.fromFile(fileArg)
.on('json', (item) => {
  // Transform data.
  const castItem = _.mapValues(item, (value) => {
    return !isNaN(value) ? _.toNumber(value) : value
  })

  // Are we only parsing tradable items?
  if (
    program.tradableOnly &&
    [BONDING_BIND_ON_PICKUP, BONDING_QUEST].includes(castItem.bonding)
  ) {
    return
  }

  // Are we only parsing equipable items?
  if (
    program.equipOnly &&
    castItem.InventoryType === INVTYPE_NON_EQUIP
  ) {
    return
  }

  // Are we only parsing items of a certain quality?
  if (
    program.minQuality &&
    castItem.Quality < parseInt(program.minQuality, 10)
  ) {
    return
  }

  // Build array of items to output.
  items.push(castItem)
})
.on('done', (error) => {
  if (error) {
    console.error(error)
  } else {
    if (program.json) {
      console.log(JSON.stringify(items))
    } else {
      items.forEach(item => {
        console.log(`(#${item.entry}) ${item.name}`)
      })
      console.log(`Total items: ${items.length}`)
    }
  }
})
