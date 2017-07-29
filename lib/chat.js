
import uuid from 'node-uuid'
import {newName} from './names'
import {sockets} from './server'
import {replace} from './replace'

const {random, floor} = Math;

const hex = '0123456789abcdef';

function randomColor() {
	const arr = new Array(3);
	for (let i = 0; i < 3; i++) {
		arr[i] = hex[floor(16 * random())];
	}

	return arr.join('');
}

function extractIDs(socket) {
	const reg 			= /https?:\/\/.+\/(.+)\/(.+)/;
	const url 			= socket.handshake.headers.referer;
	const [_, ...ids]	= reg.exec(url);

	return ids;
}

export class Chat {
	constructor(id, size, topic = "Let's Fucking Chat") {
		this.id			= id;
		this.sockets	= sockets.of(`/${id}`);
		this.size 		= size;
		this.topic 		= topic;
		this.reverser	= new Map();
		this.members 	= new Array(size);
		this.memberIds	= new Array(size);
		this.thread		= [];

		for (let i = 0; i < size; i++) {
			const id = uuid.v4();
			this.memberIds[i] = id;
			this.reverser.set(id, i);
			this.members[i] = {
				name: newName(),
				online: false,
				typing: false,
				color: randomColor()
			}
		}

		this.sockets.on('connection',
			socket => this._addSocket(socket));
	}

	_addSocket(socket) {
		const [chatID, id] 		= extractIDs(socket);
		const index 			= this.reverser.get(id);
		const {members, thread} = this;
		const member			= members[index];
		const stopTyping		= () => {
			if (typingTimeout) {
				global.clearTimeout(typingTimeout);
				typingTimeout = null;
			}
			
			members[index].typing = false;
			this.sockets.emit('update-typing', {
				index,
				typing: false
			});
		}

		let typingTimeout = null;

		if (index === null) {
			socket.disconnect();
		}

		socket.emit('init', {
			index,
			thread,
			members
		});

		member.online = true;
		this.sockets.emit('update-online', {
			index,
			online: true
		});

		socket.on('message', (msg) => {
			if (members[index].typing) {
				stopTyping();
			}

			if (msg.trim() === '')
				return;

			const message = {
				body: replace(msg),
				sender: index,
				time: Date.now()
			};
			thread.push(message);
			this.sockets.emit('message', message);
		});

		socket.on('update-name', (name) => {
			member.name = name;
			this.sockets.emit('update-name', {index, name});
		});

		socket.on('update-color', (color) => {
			member.color = color;
			this.sockets.emit('update-color', {index, color});
		})

		socket.on('disconnect', () => {
			member.online = false;
			this.sockets.emit('update-online', {
				index,
				online: false
			});
		});

		socket.on('update-typing', () => {
			if (typingTimeout) {
				global.clearTimeout(typingTimeout);
			}

			members[index].typing = true;
			this.sockets.emit('update-typing', {
				index,
				typing: true
			});

			typingTimeout = global.setTimeout(stopTyping, 5 * 1000);
		});
	}
}