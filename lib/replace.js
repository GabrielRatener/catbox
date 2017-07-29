
import {dirname} from "path"
import {Lexicon, RuleSet, BrillPOSTagger, WordPunctTokenizer} from "natural"
import {adjectives, nouns, verbs} from "./language"

const {floor, random} = Math;
const language = 'English';
const defaultTag = 'N';
const naturalRoot = tangler.resolve('natural');
const pathBase = `${dirname(naturalRoot)}/brill_pos_tagger`;
const lexicon = new Lexicon(`${pathBase}/data/${language}/lexicon_from_posjs.json`, defaultTag);
const rules = new RuleSet(`${pathBase}/data/${language}/tr_from_posjs.txt`);
const tagger = new BrillPOSTagger(lexicon, rules);
const tokenizer = new WordPunctTokenizer();

const replacements = {
	NN: {
		list: nouns,
		frequency: 0.7 // can be used optionally
	},
	ADJ: {
		list: adjectives,
		frequency: 0.7
	},
	VB: {
		list: verbs,
		frequency: 0.7
	}
};

function tokenize(text) {
	const tokens = tokenizer.tokenize(text);
	const starts = [];
	let i = 0;
	while (i < text.length) {
		if (/[ \t]/.test(text[i])) {
			i++;
			continue;
		} else {
			const length = tokens[starts.length].length;
			if (text.slice(i, i + length) === tokens[starts.length]) {
				starts.push(i);
				i += length;
				if (starts.length === tokens.length)
					return {tokens, starts};
			} else {
				throw new Error('Cannot parse!');
			}
		}
	}

	throw new Error('Unexpected end of string');
}

export function replace(text, replacer = replacements) {
	const {tokens, starts} = tokenize(text);
	const tagged = tagger.tag(tokens);
	const changeable =
	  tagged
		.map((val, i) => i)
		.filter(i => replacements.hasOwnProperty(tagged[i][1]));

	const changeIndex =
	  changeable.length > 0 ?
		changeable[floor(changeable.length * random())] :
		null ;

	let replaced = "", pos = 0;

	if (changeIndex === null)
		return text;

	for (let i = 0; i < tagged.length; i++) {
		const [token, type] = tagged[i];
		const start = starts[i];

		replaced += text.slice(pos, start);
		if (replacer.hasOwnProperty(type)) {
			const {list, frequency} = replacer[type];
			const replacement = (i === changeIndex) ?
				list[floor(list.length * random())] :
				token ;

			replaced += replacement;
		} else {
			replaced += token;
		}

		pos = start + token.length;
	}

	replaced += text.slice(pos);

	return replaced;
}