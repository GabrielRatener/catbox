
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
	console.log(hours);

	return `${(officialHour - 1) % 12 + 1}:${(minutes < 10 ? '0' : '') + minutes} ${median}`;
});

Vue.filter('getName', (index, names) => names[index]);

Vue.filter('cap', (value) => (value || '')
	.split(/\s/g)
	.map(string => string[0].toUpperCase() + string.substr(1))
	.join(' ')
	);

Vue.filter('ntobr', (value) => (value || '')
	.replace('\n', '<br/>')
	);

Vue.filter('showUnread', (value) =>
	(value > 0) ? `(${value}) ` : '');

window.onload = function(e) {

	const model = new Vue({
		el: '#app',
		data: {
			messages: [],
			names: [],
			unread: 0,
			index: null,
			text: ''
		},
		methods: {
			sendMessage() {
				socket.emit('message', this.text);
				this.text = '';
			},
			updateName() {
				socket.emit('update-name', this.names[this.index]);
			}
		}
	});

	const socket = io('http://localhost:3000');

	let visible = true;

	socket.on('init', (json) => {
		console.log(json);
		model.index = json.index;
		model.names = json.names;
		model.messages = json.thread;
	});

	socket.on('message', (json) => {
		model.messages.push(json);
		if (!visible) {
			model.unread += 1;
		}
	});

	socket.on('update-name', ({index, name}) => {
		model.names.$set(index, name);
	});

	window.addEventListener('visibilitychange', (e) => {
		visible = !document.hidden;
		if (visible) {
			model.unread = 0;
		}
	});
}