const deepClone = data => JSON.parse(JSON.stringify(data));
const getRandomInteger = (min = 0, max = 9) => {
	const math = Math.random();
	const mathI = math * (max - min);
	const floor = Math.floor(mathI);
	const minMFR = floor + min;
	return minMFR;
};

const createEvent = ({
	name = "custom event",
	detail = {},
	eventParams = {},
	target = window
}) => {
	const eventDetail = {
		bubbles: true,
		cancelable: true,
		composed: true,
		detail: { ...detail, target: target },
		...eventParams,
	};
	const newEvent = new CustomEvent(name, eventDetail);
	target.dispatchEvent(newEvent);
};

// # ELEMENT #
const getParentEl = (el, int = 1) => {
	let parentEl = el.parentElement;
	for (; int > 1; int--) parentEl = getParentEl(parentEl);
	return parentEl;
};
const clearContainerEl = containerEl => {
	[...containerEl.children].forEach(el => {
		if (!(el instanceof HTMLTemplateElement)) el.remove();
	});
};
const makeCloneTemplate = inner => {
	const tempEl = document.createElement("template");
	tempEl.innerHTML = inner;
	return tempEl.content.cloneNode(true);
};

// # FILE #
const makeFileUrl = fileInner => {
	const text = JSON.stringify(fileInner);
	const mimeType = "application/json" || "text/plain";
	const file = new Blob([text], { type: mimeType });
	const fileUrl = URL.createObjectURL(file);
	URL.revokeObjectURL(File);
	return fileUrl;
};

// # CASE #
const unCaseString = string => {
	string = string.trim();
	string = string.replace(/-|_/g, ' ');
	string = string.replace(/[A-Z]/g, match => ` ${ match.toLowerCase() }`);
	return string.trim();
};
// camelCase
const toCamelCase = string => {
	string = unCaseString(string);
	string = string.replace(/\s\w/g, match => match[1].toUpperCase());
	return string;
};
// snake_case
const toSnakeCase = string => {
	string = unCaseString(string);
	string = string.replace(/\s\w/g, match => `_${ match[1] }`);
	return string;
};
// kebab-case
const toKebabCase = string => {
	string = unCaseString(string);
	string = string.replace(/\s\w/g, match => `-${ match[1] }`);
	return string;
};
// PascalCase
const toPascalCase = string => {
	string = unCaseString(string);
	const str = string.replace(/\s\w/g, match => match[1].toUpperCase());
	const [head, tail] = [str.charAt(0).toUpperCase(), str.slice(1, str.length)];
	return head + tail;
};
// UPPER_CASE_SNAKE_CASE
const toUpperSnakeCase = string => {
	string = unCaseString(string);
	string = string.replace(/\s\w/g, match => `_${ match[1] }`);
	return string.toUpperCase();
};

/**
 * Castom Component Base Class Element
 */
class ShadowHostElement extends HTMLElement {
	constructor() {
		super();

		const html = this.html || '';
		const css = `<style>:host{display:block;box-sizing:border-box}${ this.css || '' }</style>`;

		this.attachShadow({ mode: "open" });
		this.shadowRoot.append(makeCloneTemplate(html), makeCloneTemplate(css));
		this.getEls && this.getEls.forEach(selector => this.#getElsBySelector(selector));
		this.props && Object.keys(this.props).forEach(propName => this.#setComponentsProps(propName));
	}

	static get nameIs() {
		return toKebabCase(this.prototype.constructor.name)
	}

	#getElsBySelector(selector) {
		const isStr = typeof selector === "string";
		const isArr = selector instanceof Array;
		const isEmpty = isArr && selector.length === 0;
		const isCorrectArr = !isEmpty && typeof selector[0] === "string";

		if (!isStr && !isCorrectArr) {
			const massege = 'This.getEls only <<str>> || <<[str]>>';
			return console.error(massege, selector, this);
		}

		const toCamelCaseSelector = selector => toCamelCase(
			(!selector[0] === "." && !selector[0] === "#")
			? selector
			: selector.slice(1));

		const argumentName = isArr
			? `${toCamelCaseSelector(selector[0])}Els`
			: `${toCamelCaseSelector(selector)}El`;

		const makeArgument = (name, func) => Object.defineProperty(
			this,
			name,
			{ get: () => func, configurable: true, });

		isArr
			? makeArgument(argumentName, [...this.shadowRoot.querySelectorAll(selector[0])])
			: makeArgument(argumentName, this.shadowRoot.querySelector(selector));
	}

	#setComponentsProps(propertyName) {
		const property = this.props[propertyName];
		let oldValue;

		if (this.hasOwnProperty(propertyName)) {
			oldValue = this[propertyName];
		}

		["transformer", "observer"].forEach( functionName => {
			if (!property.hasOwnProperty(functionName)) return;

			const isFunction = property[functionName] instanceof Function;
			let func;

			if (!isFunction) {
				const massege = `Property can only be function.`;
				console.error(massege, this, propertyName);
				return (property[functionName] = ({ val }) => val);
			}

			property[functionName] = isFunction ? property[functionName] : func;
			property[functionName] = property[functionName].bind(this);
		});

		const shadowPropName = `_${ propertyName }`;
		Object.defineProperty(this, propertyName, {
			enumerable: true,
			configurable: false,
			set: value => {
				const oldValue = this[shadowPropName];
				if (value === oldValue) return value;

				if (property.hasOwnProperty("transformer")) {
					value = property.transformer({ value, oldValue, [propertyName]: value });
				}

				if (value === oldValue) return value;
				this[shadowPropName] = value;

				if (property.hasOwnProperty("observer")) {
					property.observer({ value, oldValue, [propertyName]: value });
				}

				return value;
			},
			get: () => {
				if (property.hasOwnProperty("getter") && property.getter instanceof Function)
					return property.getter.bind(this)();
				return this[shadowPropName];
			},
		});

		this[propertyName] = (() => {
			if (oldValue !== undefined) return oldValue;

			if (
				this.constructor.observedAttributes &&
				this.constructor.observedAttributes.includes(propertyName)
			) {
				if (this.hasAttribute(propertyName)) {
					return this.getAttribute(propertyName) || true;
				}
			}

			if (property.hasOwnProperty("default")) {
				return property.default;
			}
		})();
	}

	emitEvent(name = 'custom event', detail = {}, params = {}) {
		createEvent({ target: this, name, detail, params });
	}

	clearContainerEl(containerEl) {
		clearContainerEl(containerEl);
	}
}
window.ShadowHostElement = ShadowHostElement;

export {
	deepClone,
	getRandomInteger,
	createEvent,
	getParentEl,
	clearContainerEl,
	makeCloneTemplate,
	makeFileUrl,
	unCaseString,
	toCamelCase,
	toSnakeCase,
	toKebabCase,
	toPascalCase,
	toUpperSnakeCase,
	ShadowHostElement
}
