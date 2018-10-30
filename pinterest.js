'use strict'

const axios = require('axios')

module.exports.call = async (event, context) => {
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

console.log('slackUrl', process.env.slackUrl)

  try {
    const result = await axios.post(process.env.slackUrl, params, headers)
    console.log('result', result)
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Ping slack successful!'
      }),
    }
  } catch (err) {
    console.log('err', err)
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: err.message
      }),
    }
  }
}
