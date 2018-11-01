'use strict'

const axios = require('axios')

module.exports.pingSlack = async ({
  slackUrl,
  attachment,
  username,
  channel,
}) => {
  console.log('pinging to slack: ', process.env.slackUrl)

  const headers = {
    headers: {
      'Content-Type': 'application/json;charset=UTF-8',
      'Access-Control-Allow-Origin': '*',
    }
  }

  attachment['color'] = attachment['color'] || '#5bc0de' // default boostrap color for info

  const params = { attachments: [attachment] }
  // each webhook has a default channel; will ping that channel if no channel argument provided
  params['channel'] = channel || params['channel']
  params['username'] = username || 'Kakashi'

  const result = await axios.post(process.env.slackUrl, params, headers)

  console.log('pingSlack result', result)
  return result
}