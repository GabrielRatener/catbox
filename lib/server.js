
import {Server} from 'http'
import express from 'express'
import io from 'socket.io'
import jade from 'pug'
import startREPL from './repl'

export const
	app 		= express(),
	server 		= new Server(app),
	sockets 	= io.listen(server),
	chats		= new Map(),	// chatID => Chat obj map
	host		= (process.argv.length > 2) ? process.argv[2] : 'localhost',
	protocol	= (process.argv.length > 3) ? process.argv[3] : 'http',
	port		= process.env.PORT || (protocol === 'https') ? 443 : 80;



app.set('view engine', 'pug');

app.use(express.static('public'));

app.get('/:chat/:participant', (req, res) => {
	if (!chats.has(req.params.chat)) {
		res.send(404);
		return;
	}

	const chat = chats.get(req.params.chat);

	if (!chat.reverser.has(req.params.participant)) {
		res.send(404);
		return;
	}

	const index 	= chat.reverser.get(req.params.participant);
	const {topic} 	= chat;

	res.render('index.jade', {
		topic,
		organization: 'CatBox',
		name: chat.members[index].name,
	});
});

// this is where the everything starts
export default function init() {
	server.listen(port);
	console.log('Enter js here, or type "help()"');
	startREPL();	
}




