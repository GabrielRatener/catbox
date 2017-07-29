
import {adjectives, nouns} from "./language"

/*
 * Generate random names
 *
 */

const {floor, random} = Math;

const cache = new Set();

function randomIndex(arr) {
	return floor(random() * arr.length);
}

function randomElement(arr) {
	return arr[randomIndex(arr)];
}

export function randomName() {
	const adj 	= randomElement(adjectives);
	const noun 	= randomElement(nouns);

	return `${adj} ${noun}`;
}

export function newName() {
	const ai = randomIndex(adjectives);
	const ni = randomIndex(nouns);

	cache.add(`${ai} ${ni}`);

	return `${adjectives[ai]} ${nouns[ni]}`;
}


