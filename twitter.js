'use strict'

const axios = require('axios')
const path = require('path')
const PingSlack = require('./services/pingSlack').pingSlack
const aws = require('aws-sdk')

module.exports.call = async (event, context) => {
  // TODO validate twitterWidgetJsPath does not start with /

  //  define paths here so that can unlink file in catch block
  const twitterWidgetPath = path.resolve(__dirname, 'tmp', 'twitterWidget.js')

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
    
    ///// twitter widget.js START /////
    // download widget file
    const downloadTwitterWidgetResp = await axios({
      method: 'GET',
      url: 'https://platform.twitter.com/widgets.js',
      responseType: 'stream'
    })

    // stream into s3
    s3Params['Key'] = process.env.twitterWidgetJsPath
    s3Params['Body'] = downloadTwitterWidgetResp.data
    await s3.upload(s3Params).promise()
    ///// twitter widget.js END /////

    const attachment = {}
    attachment['text'] = 'Twitter widget vendor files uploaded successfully'
    attachment['title'] = 'SUCCESS - Twitter vendor files'
    attachment['color'] = 'good'
    await PingSlack({
      slackUrl: process.env.slackUrl,
      attachment: attachment,
    })

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Successfully Twitter files uploaded to S3'
      }),
    }
  } catch (err) {
    const attachment = {}
    attachment['text'] = `Error when uploading Twitter vendor files\Message: ${err.message}`
    attachment['title'] = 'FAILURE - Twitter vendor files'
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
