import { ShadowHostElement } from './ShadowHostElement.js';

class RootApp extends ShadowHostElement {
	get html () { return `
		<div class="title">Hello World.</div>
	`}

	get css() { return `
		:host {
			display: flex;
			justify-content: center;
			align-items: center;
			height: 100vh;
		}

		.title {
			font-size: 3rem;
			color: var(--color-1)
		}
	`}
}

customElements.define(RootApp.nameIs, RootApp);
