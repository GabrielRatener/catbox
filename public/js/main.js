
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
	index !== null ? members[index].name : '');

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

function showBox() {
	const messages = document.querySelector('.thread');
	messages.scrollTop = messages.scrollHeight;
}

window.onload = function(e) {

	const model = new Vue({
		el: '#app',
		data: {
			thread: [],
			members: [],
			unread: 0,
			index: null,
			text: ''
		},
		methods: {
			sendMessage(e) {
				socket.emit('message', this.text);
				this.text = '';
			},
			updateName(e) {
				socket.emit('update-name', this.members[this.index].name);
			},
			addMessage(message) {
				if (this.thread.length > 0) {
					const top = this.thread.length - 1;
					const last = this.thread[top];

					// if more than a minute between thread
					if (message.time - last.time < 60000
						&& last.sender === message.sender) {

						this.thread.$set(top, {
							body: `${last.body}\n${message.body}`,
							time: message.time,
							sender: message.sender
						});

						return;
					}
				}
				
				this.thread.push(message);
			}
		}
	});

	const [_, cid, uid] =
		window.location.pathname.split('/');
	const url =
		`${window.location.protocol}//${window.location.hostname}:8080/${cid}`;
	const socket = io(url);

	console.log(url);

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
		model.addMessage(json);
		window.setTimeout(showBox, 0);
		if (!visible) {
			model.unread += 1;
		}
	});

	socket.on('update-name', ({index, name}) => {
		model.members[index].name = name;
	});

	socket.on('update-online', ({index, online}) => {
		model.members[index].online = online;
	});

	window.addEventListener('visibilitychange', (e) => {
		visible = !document.hidden;
		if (visible) {
			model.unread = 0;
		}
	});
}