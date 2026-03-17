const http = require('http');

const payload = JSON.stringify({
  object: 'instagram',
  entry: [{
    id: '17841460161632234',
    time: Date.now(),
    changes: [{
      field: 'messages',
      value: {
        messaging: [{
          sender: { id: '999999999' },
          message: {
            attachments: [{
              type: 'video',
              payload: {
                reel_video_id: '1234567890',
                url: 'https://www.instagram.com/reel/ABCDEF/'
              }
            }]
          }
        }]
      }
    }]
  }]
});

const opts = {
  hostname: 'localhost',
  port: 5001,
  path: '/webhook',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': payload.length
  }
};

const req = http.request(opts, res => {
  console.log('Status', res.statusCode);
  res.on('data', d => process.stdout.write(d));
});
req.on('error', e => console.error(e));
req.write(payload);
req.end();
