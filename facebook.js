'use strict'

const axios = require('axios')
const fs = require('fs')
const replace = require('replace-in-file')
const PingSlack = require('./services/pingSlack').pingSlack
const aws = require('aws-sdk')

module.exports.call = async (event, context) => {
  // TODO validate facebookSDKJSPath does not start with /

  // define paths here so that can unlink file in catch block
  // lambda support read/write to /tmp only for now
  const facebookSDKPath = '/tmp/facebookSDK.js'

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

    ///// facebookSDK START /////
    // download facebook sdk file
    const downloadFBSDKResp = await axios({
      method: 'GET',
      url: 'https://connect.facebook.net/en_US/sdk.js',
      responseType: 'stream'
    })

    // write to file
    await downloadFBSDKResp.data.pipe(fs.createWriteStream(facebookSDKPath))

    // change file content
    const options = {
      files: facebookSDKPath,
      from: 'https:\/\/connect.facebook.net\/en_US\/sdk.js',
      to: `https:\/\/${process.env.assetHostName}\/${process.env.facebookSDKJSPath.replace('/', '\/')}`,
    }
    await replace(options)

    // // stream file to S3
    const FBSDKStream = await fs.createReadStream(facebookSDKPath)
    s3Params['Key'] = process.env.facebookSDKJSPath
    s3Params['Body'] = FBSDKStream
    await s3.upload(s3Params).promise()

    // delete file
    await fs.unlink(facebookSDKPath)
    ///// facebookSDK file END /////

    const attachment = {}
    attachment['text'] = 'Facebook SDK vendor files uploaded successfully'
    attachment['title'] = 'SUCCESS - Facebook SDK vendor files'
    attachment['color'] = 'good'
    await PingSlack({
      slackUrl: process.env.slackUrl,
      attachment: attachment,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully Facebook SDK files uploaded to S3'
      }),
    }
  } catch (err) {
    // delete files if fail
    if (facebookSDKPath) {
      await fs.unlink(facebookSDKPath)
    }

    const attachment = {}
    attachment['text'] = `Error when uploading Facebook SDK vendor files\Message: ${err.message}`
    attachment['title'] = 'FAILURE - Facebook SDK vendor files'
    attachment['color'] = 'danger'
    await PingSlack({
      slackUrl: process.env.slackUrl,
      attachment: attachment,
      channel: process.env.slackChannel,
    })

    console.log('err', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message
      }),
    }
  }
}
