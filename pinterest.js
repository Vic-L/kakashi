'use strict'

const axios = require('axios')
const fs = require('fs')
const path = require('path')
const replace = require('replace-in-file')
const PingSlack = require('./services/pingSlack').pingSlack
const aws = require('aws-sdk')

module.exports.call = async (event, context) => {
  // TODO validate pinitJsPath does not start with /
  // TODO validate pinitMainJsPath does not start with /

  //  define paths here so that can unlink file in catch block
  const pinitPath = path.resolve(__dirname, 'tmp', 'pinit.js')

  try {
    // s3 setup
    const s3 = new aws.S3({
      accessKeyId: process.env.s3AccessKeyId,
      secretAccessKey: process.env.s3SecretAccessKey,
      region: process.env.s3Region
    })
    const s3Params = {
      Bucket: process.env.s3Bucket,
      CacheControl: 'public,max-age=604800',
      ContentType: 'application/javascript; charset=utf-8',
      ACL: 'public-read',
    }
    ///// pinit_main START /////
    // download pinit_main file
    const downloadPinitMainResp = await axios({
      method: 'GET',
      url: 'https://assets.pinterest.com/js/pinit_main.js',
      responseType: 'stream'
    })

    // stream into s3
    s3Params['Key'] = process.env.pinitMainJsPath
    s3Params['Body'] = downloadPinitMainResp.data
    await s3.upload(s3Params).promise()
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
      to: `//${process.env.assetHostName}/${process.env.pinitMainJsPath}`,
    }
    await replace(options)

    // stream file to S3
    const pinitStream = await fs.createReadStream(pinitPath)
    s3Params['Key'] = process.env.pinitJsPath
    s3Params['Body'] = pinitStream
    await s3.upload(s3Params).promise()

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
