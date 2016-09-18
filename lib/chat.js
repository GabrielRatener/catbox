
import uuid from 'node-uuid'
import {newName} from './names'

function extractIDs(socket) {
	const reg 			= /https?:\/\/.+\/(.+)\/(.+)/;
	const url 			= socket.handshake.headers.referer;
	const [_, ...ids]	= reg.exec(url);

	return ids;
}

export class Chat {
	constructor(id, io, size, topic = "Let's Fucking Chat") {
		this.id			= id;
		this.sockets	= io.of(`/${id}`);
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
				online: false
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
			const message = {
				body: msg,
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

		socket.on('disconnect', () => {
			member.online = false;
			this.sockets.emit('update-online', {
				index,
				online: false
			});
		});
	}
}