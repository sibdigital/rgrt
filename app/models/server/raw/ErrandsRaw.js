import { BaseRaw } from './BaseRaw';

export class ErrandsRaw extends BaseRaw {
	find(...args) {
		return this.col.find(...args);
	}
}
