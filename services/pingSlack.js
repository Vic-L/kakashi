'use strict'

const axios = require('axios')

module.exports.pingSlack = async ({
  slackUrl,
}) => {
  console.log('pinging to slack: ', process.env.slackUrl)

  const headers = {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
    }
  }
  const attachment = {}
  attachment['text'] = 'test'
  attachment['color'] = '#5bc0de' // default boostrap color for info
  attachment['title'] = 'Pinterest vendor files has error'

  const params = { attachments: [attachment] }
  // uncomment below and fill in custom channel
  // params['channel'] = ''
  params['username'] = 'Pinterest kakashi'

  const result = await axios.post(process.env.slackUrl, params, headers)

  console.log('pingSlack result', result)
  return result
}