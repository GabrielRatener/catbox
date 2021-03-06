
const hexSet = new Set('0123456789abcdefABCDEF');

Vue.filter('signify', (value, name) => {
	if (value === name) {
		return `me (${name}):`;
	} else {
		return value + ':';
	}
});

Vue.filter('initials', (value) => (value || '')
	.split(/\s+/g)
	.map(word => word[0])
	.join('')
	);


Vue.filter('time', (value) => {
	const date = new Date(+value);
	const hours = date.getHours();
	const median = (11 < hours && hours < 24) ? 'PM' : 'AM';
	const minutes = date.getMinutes();
	const officialHour = (hours === 0) ? 12 : hours;

	return `${(officialHour - 1) % 12 + 1}:${(minutes < 10 ? '0' : '') + minutes} ${median}`;
});

Vue.filter('getName', (index, members) =>
	index !== null && index > -1 ? members[index].name : '');

Vue.filter('cap', (value) => (value || '')
	.split(/\s/g)
	.map(string => string?string[0].toUpperCase() + string.substr(1) : '')
	.join(' ')
	);

Vue.filter('ntobr', (value) => (value || '')
	.replace(/\n/g, '<br/>')
	);

Vue.filter('showUnread', (value) =>
	(value > 0) ? `(${value}) ` : '');

Vue.filter('bool', (value, truthy = 'yes', falsy = 'no') => 
	value? truthy : falsy);

Vue.filter('contains', (array, key, value, index = -1) => {
	for (let i = 0; i < array.length; i++) {
		const element = array[i];
		if (i === index) {
			continue;
		}

		if (element.hasOwnProperty(key) && element[key] === value) {
			return true;
		}
	}

	return false;
});

Vue.filter('typingNames', (array, index) => {
	const arr = [];
	for (let i = 0; i < array.length; i++) {
		const {typing, name} = array[i];
		if (typing && i !== index) {
			arr.push(name);
		}
	}

	switch (arr.length) {
		case 1:
			return `${arr[0]} is typing...`;
		case 2:
			return `${arr[0]} and ${arr[1]} are typing...`;
		default:
			const last = arr.pop();
			return `${arr.join(', ')}, and ${last} are typing...`;
	}
});

Vue.filter('length', (value) => value.length);

Vue.filter('rgb', (value) => `rgb(${value.join(',')})`)

Vue.filter('color', (value) => {
	const base = '#000';
	if (value.length === 3 || value.length === 6) {
		for (let char of value) {
			if (!hexSet.has(char)) {
				return base;
			}
		}
		return `#${value}`;
	} else {
		return base;
	}
});

function showBox() {
	const messages = document.querySelector('.thread');
	messages.scrollTop = messages.scrollHeight;
}

window.onload = function(e) {
	const audio = new Audio('../../slap.wav');
	const model = new Vue({
		el: '#app',
		data: {
			thread: [],
			members: [],
			unread: 0,
			index: null,
			text: '',
			typing: -1
		},
		methods: {
			sendMessage(e) {
				const trimmed = this.text.trim()
				socket.emit('message', trimmed);					
				this.text = '';
			},
			update(property) {
				socket.emit(`update-${property}`,
					this.members[this.index][property]);
			},
			addMessage(message) {
				if (this.thread.length > 0) {
					const top = this.thread.length - 1;
					const last = this.thread[top];

					// if more than a minute between thread
					if (message.time - last.time < 60000
						&& last.sender === message.sender) {

						this.thread.$set(top, {
							body: `${last.body}\n\n${message.body}`,
							time: message.time,
							sender: message.sender
						});

						return;
					}
				}
				
				this.thread.push(message);
			},
			showTyping() {
				if (this.text.trim() === '')
					return;
				else
					socket.emit('update-typing', true);
			}
		}
	});

	const [_, cid, uid] =
		window.location.pathname.split('/');
	const url =
		`${window.location.protocol}//${window.location.hostname}:`
			+ `${window.location.port}/${cid}`;
	const socket = io(url);

	const updatableProperties = ['name', 'online', 'color'];

	let visible = true;

	socket.on('init', (json) => {
		console.log(json);

		model.thread = [];
		model.index = json.index;
		model.members = json.members;
		json.thread.forEach(
			message => model.addMessage(message))
		window.setTimeout(showBox, 0);
	});

	socket.on('message', (json) => {
		if (json.sender !== model.index)
			audio.play();
		model.addMessage(json);
		window.setTimeout(showBox, 0);
		if (!visible) {
			model.unread += 1;
		}
	});

	for (let property of updatableProperties) {
		socket.on(`update-${property}`, (msg) => {
			model.members[msg.index][property] = msg[property];
		});
	}


	socket.on('update-typing', ({index, typing}) => {
		if (index === model.index) {
			return;
		}

		if (typing) {
			model.typing = index;
		} else {
			if (index === model.typing) {
				model.typing = -1;
			}
		}

		model.members[index].typing = typing;
	});

	window.addEventListener('visibilitychange', (e) => {
		visible = !document.hidden;
		if (visible) {
			model.unread = 0;
		}
	});
}