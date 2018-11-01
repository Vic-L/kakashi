'use strict'

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const replace = require('replace-in-file')
const PingSlack = require('./services/pingSlack').pingSlack

module.exports.call = async (event, context) => {
  //  define paths here so that can unlink file in catch block
  const pinitMainPath = path.resolve(__dirname, 'tmp', 'pinit_main.js')
  const pinitPath = path.resolve(__dirname, 'tmp', 'pinit.js')

  try {
    ///// pinit_main START /////
    // download pinit_main file
    const downloadPinitMainResp = await axios({
      method: 'GET',
      url: 'https://assets.pinterest.com/js/pinit_main.js',
      responseType: 'stream'
    })

    // write to file
    await downloadPinitMainResp.data.pipe(fs.createWriteStream(pinitMainPath))

    // upload to s3

    // delete file
    await fs.unlink(pinitMainPath)
    ///// pinit_main END /////

    ///// pinit file START /////
    // download pinit file
    const downloadPinitResp = await axios({
      method: 'GET',
      url: 'https://assets.pinterest.com/js/pinit.js',
      responseType: 'stream'
    })

    // write to file
    await downloadPinitResp.data.pipe(fs.createWriteStream(pinitPath))

    // change file content
    const options = {
      files: pinitPath,
      from: '//assets.pinterest.com/js/pinit_main.js',
      to: process.env.pinitMainJsPath,
    }
    await replace(options)

    // upload file to S3

    // delete file
    await fs.unlink(pinitPath)
    ///// pinit file END /////

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'downloaded and deleted file'
      }),
    }
  } catch (err) {
    // delete files if fail
    if (pinitMainPath) {
      await fs.unlink(pinitMainPath)
    }
    if (pinitPath) {
      await fs.unlink(pinitPath)
    }

    console.log('err', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message
      }),
    }
  }
}
