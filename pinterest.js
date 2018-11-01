'use strict'

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const replace = require('replace-in-file')
const PingSlack = require('./services/pingSlack').pingSlack

module.exports.call = async (event, context) => {
  try {
    // download file
    const downloadResp = await axios({
      method: 'GET',
      url: 'https://assets.pinterest.com/js/pinit.js',
      responseType: 'stream'
    })

    const filepath = path.resolve(__dirname, 'tmp', 'pinit.js')

    // write to file
    await downloadResp.data.pipe(fs.createWriteStream(filepath))

    // change file content
    const options = {
      files: filepath,
      from: '//assets.pinterest.com/js/pinit_main.js',
      to: process.env.pinitMainJsPath,
    }
    await replace(options)

    // upload file to S3

    // delete file
    await fs.unlink(filepath)

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'downloaded and deleted file'
      }),
    }
  } catch (err) {
    // delete file if fail
    await fs.unlink(filepath)

    console.log('err', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message
      }),
    }
  }
}
