
import {Server} from 'http'
import express from 'express'
import io from 'socket.io'
import jade from 'pug'
import uuid from 'node-uuid'
import {newName} from './lib/names'

const app 		= express();
const server 	= new Server(app);
const sockets 	= io(3000);
const reverser	= new Map();
const size	 	= process.argv[3];
const topic		= (process.argv.length > 4) ? process.argv[4] : "Let's Fuckin Chat!";
const members	= new Array(size);
const names		= new Array(size);
const statii	= new Array(size);
const hostname	= '127.0.0.1:8080';
const thread	= [];

function extractId(socket) {
	const reg 		= /http:\/\/.+\/(.+)/;
	const url 		= socket.handshake.headers.referer;
	const [_, id] 	= reg.exec(url);

	return id;
}

function transformMessage(message) {
	const obj = Object.assign({}, message);


}

app.set('view engine', 'jade');

console.log(`Creating ${size} users:`);

for (let i = 0; i < size; i++) {
	const id = uuid.v4();
	members[i] = id;
	names[i] = newName();
	reverser.set(id, i);
	console.log(`  http://${hostname}/${id}`);
}

sockets.on('connection', (socket) => {
	const id = extractId(socket);
	const index = reverser.get(id);
	socket.emit('init', {
		index,
		thread,
		names
	});

	socket.on('message', (msg) => {
		const message = {
			body: msg,
			sender: index,
			time: Date.now()
		};
		thread.push(message);
		sockets.emit('message', message);
	});

	socket.on('update-name', (name) => {
		names[index] = name;
		sockets.emit('update-name', {index, name});
	});
});

app.use(express.static('public'));

app.get('/:id', (req, res) => {
	const index 		= reverser.get(req.params.id);
	const memberList	= new Array(size);
	
	for (let i = 0; i < size; i++) {
		memberList[i] = {
			name: names[i],
			status: statii[i]
		};
	}

	res.render('index.jade', {
		topic,
		organization: 'CatBox',
		members: memberList,
		name: names[index],
	});
});

server.listen(8080);