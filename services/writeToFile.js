'use strict'

const fs = require('fs')

module.exports.writeToFile = async (data, filepath) => {
  // with reference to https://futurestud.io/tutorials/download-files-images-with-axios-in-node-js

  data.pipe(fs.createWriteStream(filepath))
  return new Promise((resolve, reject) => {
    data.on('end', () => {
      resolve()
    })

    data.on('error', () => {
      reject()
    })
  })
}