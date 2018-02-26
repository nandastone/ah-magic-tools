#!/usr/bin/env node

const program = require('commander')
const csv = require('csvtojson')
const _ = require('lodash')

const packageJson = require('./package.json')
const INVTYPE_NON_EQUIP = 0

let fileArg = ''

program
  .version(packageJson.version)
  .usage('[options] <file>')
  .option('--equip-only', 'Only export items that are equipable.')
  .option('--min-quality [quality]', 'Minimum item quality.')
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
    }
  }
})
