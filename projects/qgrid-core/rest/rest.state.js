import { serializeGet } from './get.serialize';

export class RestState {
	constructor() {
		this.url = '';
		this.method = 'get';
		this.serialize = serializeGet;
	}
}
