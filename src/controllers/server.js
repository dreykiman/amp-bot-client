import WebSocket from 'ws';
import onmessage from './message'

process.on('SIGINT', () => {
  console.log("Caught interrupt signal")
  ws.close()
  setTimeout(process.exit, 500)
});

process.once('SIGUSR2', () => {
  ws.close()
  setTimeout(() => process.kill(process.pid, 'SIGUSR2'), 500);
});



var ws = new WebSocket("ws://13.125.100.61:8081/socket");

ws.onerror = (err) => {
  console.log('err: ', err);
}

ws.onclose = () => {
  console.log("Connection is closed...");
}

ws.onopen = (ev) => {
  console.log('Connection is open ...');
}

export const close = async (req, res) => {
  ws.close()
  res.json({msg: 'closed'})
}


export const open = async (req, res) => {
  setTimeout(() => {
    if( ws.readyState === ws.CLOSED ) {
      ws = new WebSocket("ws://13.125.100.61:8081/socket")
    } else if( ws.readyState === ws.CONNECTING || ws.readyState === ws.OPEN ){
      return
    } else {
      open();
    }
  }, 500)
  res.json({msg: ws});
}

export default ws
