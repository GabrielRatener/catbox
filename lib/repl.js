
import {runInNewContext} from 'vm'
import readline from 'readline'
import uuid from 'node-uuid'
import {newName} from './names'
import {Chat} from './chat'
import {chats, protocol, host} from './server'

// REPL API
export const api = {
	help() {
		console.log('API:\n');
		console.log(' chat');
		console.log('  .create(size : int, topic : string)  # create chat & generate URLs');
		console.log('  .delete(id : string)  # delete chat with ID generated from .create');
	},
	chat: {
		create(size, topic) {
			const id 	= uuid.v4();
			const chat	= new Chat(id, size, topic);
			chats.set(id, chat);

			console.log(`Generating chat...`);
			console.log(` Chat ID: ${id}`);
			console.log(` URLs:`);
			for (let i = 0; i < chat.size; i++) {
				console.log(`  ${protocol}://${host}/${id}/${chat.memberIds[i]}`);
			}
		},
		delete(id) {
			if (chats.has(id)) {
				chats.delete(id);
				console.log(`Deleted chat "${id}"`);
			} else {
				console.log(`Chat "${id}" doesn't exist`);
			}
		}		
	}
};

// simple wrapper function
export function prompt(question, callback) {
	let r = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});

	r.question(question, function(answer) {
		r.close();
		callback(null, answer);
	});
}

// repl made simple
export default function startREPL() {
	prompt('>> ', (err, text) => {
		const result = runInNewContext(text, api);
		console.log();
		startREPL();
	});
}

