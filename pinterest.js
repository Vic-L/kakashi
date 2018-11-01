'use strict'

const pingSlack = require('./services/pingSlack').pingSlack

module.exports.call = async (event, context) => {
  try {
    await pingSlack({
      slackUrl: process.env.slackUrl,
    })

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
