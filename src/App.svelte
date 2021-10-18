<script>
	import { fade, fly } from "svelte/transition";
	import changeTheme from './theme.js';
	import generateWiggle from './wiggle.js';

	let text = '';
	let wiggleRate = "0.2";
	let lineLength = "50";
	let lineCount = "100";

	let output = '';

	let copyButtonText = "Copy text";

	let error = '';

	$: _ = (async () => {
		let validatedInput;

		if (isNumber(wiggleRate) && isNumber(lineCount) && isNumber(lineLength)) {
			const wiggleRateNum = parseFloat(wiggleRate);
			const lineCountNum = parseInt(lineCount);
			const lineLengthNum = parseInt(lineLength);
			if (lineLengthNum > 1000) {
				error = "Line length should not be more than 1000 (not optimised, yet!)"
			} else {
				validatedInput = {wiggleRateNum, lineCountNum, lineLengthNum}
				error = ''
			}
		} else {
			if (!isNumber(wiggleRate)) {
				error = "Wiggle rate is not a valid positive number"
			} else if (!isNumber(lineCount)) {
				error = "Line count is not a valid positive number"
			} else if (!isNumber(lineLength)) {
				error = "Line length is not a valid positive number"
			}
		}

		if (validatedInput) {
			copyButtonText = "Copy text";
			output = await generateWiggle(text ? text : 'wiggle', validatedInput.wiggleRateNum, validatedInput.lineCountNum, validatedInput.lineLengthNum);
		}
	})()

	function isNumber(string) {
		if (string.length == 0) return false

		let periodCounter = 0;
		for (const c of string.split('')) {
			if (isNaN(parseInt(c))) {
				if (c == '.') {
					if(++periodCounter > 1) return false
				} else {
					return false
				}
			}
		}
		return true
	}

	function copyOutput() {
		const inputElement = document.querySelector("#copy-area");
		inputElement.select();
		inputElement.setSelectionRange(0, 9999999); /* For mobile devices */
		document.execCommand("copy");
		copyButtonText = "Copied!"
	}
</script>

<main>
	<h1>Wiggle generator</h1>
	<p>Superimpose ascii chacracters on a sine wave :P</p>
	<div id="input-options">
			<div class="row">
				<div class="split">
					<div id="wiggle-rate-wrapper" class="wrapper">
						<label for="wiggle-text">Wiggle rate</label>
						<input type="text" bind:value={wiggleRate} name="wiggle-rate" id="wiggle-rate">
						<span class="tooltip">Like wavelength</span>
					</div>
				</div>
				<div class="split">
					<div id="line-length-wrapper" class="wrapper">
						<label for="line-length">Line length</label>
						<input type="text" name="line-length" id="line-length" bind:value={lineLength}>
						<span class="tooltip">Maximum length of a line</span>
					</div>
				</div>
				<div class="split">
					<div id="line-count-wrapper" class="wrapper">
						<label for="line-count">Line count</label>
						<input type="Text" name="line-count" id="line-count" bind:value={lineCount}>
						<span class="tooltip">Number of lines of generated text</span>
					</div>
				</div>
		</div>
		<div id="text-wrapper">
			<input type="text" name="wiggle-text" id="wiggle-text" placeholder="wiggle" bind:value={text}>
		</div>
	</div>
	<button type="button" name="button" id="copy-button" on:click={copyOutput}>{copyButtonText}</button>
	<div id="output-wrapper">
		<p id="output" contenteditable="false" >{output}</p>
	</div>

	<textarea id="copy-area" class="i-not-exists" readonly>{output}</textarea>
	<a href="https://github.com/arj101/wiggle-generator-web">View source code on Github</a>
</main>

<button type="button" name="button" id="theme-switcher" on:click={changeTheme}>
	<svg xmlns="http://www.w3.org/2000/svg" enable-background="new 0 0 24 24" height="24px" viewBox="0 0 24 24" width="24px" fill="#000000"><g><rect fill="none" height="24" width="24"/></g><g><g><g><g><path d="M12,22C6.49,22,2,17.51,2,12S6.49,2,12,2s10,4.04,10,9c0,3.31-2.69,6-6,6h-1.77c-0.28,0-0.5,0.22-0.5,0.5 c0,0.12,0.05,0.23,0.13,0.33c0.41,0.47,0.64,1.06,0.64,1.67C14.5,20.88,13.38,22,12,22z M12,4c-4.41,0-8,3.59-8,8s3.59,8,8,8 c0.28,0,0.5-0.22,0.5-0.5c0-0.16-0.08-0.28-0.14-0.35c-0.41-0.46-0.63-1.05-0.63-1.65c0-1.38,1.12-2.5,2.5-2.5H16 c2.21,0,4-1.79,4-4C20,7.14,16.41,4,12,4z"/><circle cx="6.5" cy="11.5" r="1.5"/><circle cx="9.5" cy="7.5" r="1.5"/><circle cx="14.5" cy="7.5" r="1.5"/><circle cx="17.5" cy="11.5" r="1.5"/></g></g></g></g></svg>
</button>

{#if error}
  <div id="error-indicator" in:fly={{ y: 100, duration: 150}} out:fly={{ y: 100, duration: 200}}>
	<p>{error}</p>
  </div>
{/if}

<style>
	/*forgot color scheme url :skull:*/
	:global(.theme-green) {
		--bg: #3B7455;
		--bg-2: #3B7455;
		--bg-main: rgba(31, 31, 31, 0.87);
		--text: rgb(255, 255, 255);
		--text-2: rgb(255, 255, 255);
		--heading-text: #69DC9E;
		--input-border: #69DC9E;

		--shadow-lowered: 0px 2px 4px rgba(0, 0, 0, 0.2);
		--shadow-medium-high: 0px 4px 8px rgba(0, 0, 0, 0.4);
		--shadow-raised: 0px 8px 15px rgba(0, 0, 0, 0.4);
	}

	/*https://coolors.co/ffc4eb-ffe4fa-f1dedc-e1dabd-abc798*/
	:global(.theme-light) {
		--bg: #BCB8B1;
		--bg-2: #3A3430;
		--bg-main: #F4F3EE;
		--text: rgb(0, 0, 0);
		--text-2: rgb(255, 255, 255);
		--heading-text: rgb(0, 0, 0);
		--input-border: #BCB8B1;

		--shadow-lowered: 0px 2px 4px rgba(0, 0, 0, 0.15);
		--shadow-medium-high: 0px 4px 8px rgba(0, 0, 0, 0.3);
		--shadow-raised: 0px 8px 15px rgba(0, 0, 0, 0.3);
	}

	:global(.theme-dark) {
		--bg: #0D0E0D;
		--bg-2: #358471;
		--bg-main: #111817/* #0D0E0D*/;
		--text: #DCE1DE;
		--text-2: #DCE1DE;
		--heading-text: #DCE1DE;
		--input-border: #358471;

		--shadow-lowered: 0px 2px 4px rgba(0, 0, 0, 0.3);
		--shadow-medium-high: 0px 4px 8px rgba(0, 0, 0, 0.6);
		--shadow-raised: 0px 8px 15px rgba(0, 0, 0, 0.6);
	}

	:global(body) {
		background-color: var(--bg);
		padding: 0;
		transition: background-color 300ms ease;
		transition-delay: 100ms;
	}
	main {
		background-color: var(--bg-main);
		position: absolute;
		min-height: 100vh;
		width:  68vw;
		margin: 0;
		left: calc(16vw - 2%);
		top: 0;
		transition: all 300ms ease;
		font-family: 'Roboto', sans-serif;
		padding-right: 2%;
		padding-left: 2%;
		padding-bottom: 0.8rem;
	}

	h1 {
		margin-inline-start: 2%;
		margin-bottom: 0;
		font-weight: 500;
		font-size: 0.95rem;
		color: var(--heading-text);
		text-transform: uppercase;
	}

	p {
		width: 80%;
		margin: 0;
		margin-inline-start: 2%;
		margin-bottom: 3%;
		font-weight: 300;
		font-size: 0.95rem;
		color: var(--text);
	}

	label {
		color: var(--text);
		font-weight: 300;
		font-size: 0.9rem;
		margin-bottom: 2px;
	}

	input {
		position: relative;
		background-color: rgba(0, 0, 0, 0);
		color: var(--text);
		border-width: 0.2rem;
		transition: all 300ms ease;
		border: 2px solid var(--input-border);
		box-shadow: var(--shadow-lowered);
		width: 100%;
		outline: 1px solid rgba(0, 0, 0, 0);
	}


	input:hover {
		box-shadow: var(--shadow-medium-high);
	}

	input:focus {
		box-shadow: var(--shadow-raised);
		transform: translateY(-2%);
		border-color: rgba(0, 0, 0, 0);
		outline: 1px solid var(--input-border);
	}

	#column {
		display: flex;
		align-items: stretch;
		width: 100%;
		flex-direction: column;
		justify-content: center;
	}

	.row {
		display: flex;
		align-items: center;
		flex-direction: row;
		justify-content: center;
		width: 98%;
		margin-left: 1%;
		margin-right: 1%;
	}

	.split {
		display: grid;
		place-items: center;
		width: 50%;
		height: 100%;
	}

	.wrapper {
		width: 92%;
		display: flex;
		align-items: flex-start;
		justify-content: space-evenly;
		flex-direction: column;
		position: relative;
	}

	#wiggle-text {
		margin: 2%;
		width: 96%;
	}

	.tooltip {
		color: var(--text-2);
		background-color: var(--bg-2);
		padding: 0.2rem;
		padding-right: 0.5rem;
		padding-left: 0.5rem;
		font-size: 0.8rem;
		border-radius: 0.2rem;
		box-shadow: var(--shadow-raised);

		position: absolute;
		right: 0%;
		bottom: 50%;
		text-align:left;

		opacity: 0;
		pointer-events: none;

		transition: all 100ms ease-in-out;
		max-width: 60%;
	}

	.wrapper:hover .tooltip {
		bottom: 80%;
		opacity: 0.95;
		pointer-events: all;
	}

	input:focus + .tooltip {
		bottom: 80%;
		opacity: 0.95;
		pointer-events: all;
	}

	::-webkit-input-placeholder { /* Edge */
		font-weight: 300;
	}

	:-ms-input-placeholder { /* Internet Explorer 10-11 */
		font-weight: 300;
	}

	::placeholder {
		font-weight: 300;
	}

	#output-wrapper {
		margin: 2%;
		width: 96%;
		overflow: auto;
		transform: rotateX(180deg);
		/* -moz-transform: rotateX(180deg); */
		word-wrap:break-word;
		padding: 0;
		white-space: pre;
	}

	#output-wrapper::-webkit-scrollbar {
	  width: 0.6em;
	}

	#output-wrapper::-webkit-scrollbar-track {
		background-color: var(--bg-main);
		border-radius: 0.2em;
	}

	#output-wrapper::-webkit-scrollbar-thumb {
	  background-color: var(--bg);
	  border-radius: 0.2em;
	}

	#output {
		transform: rotateX(-180deg);
	}


	#output {
		width: 100%;
		margin: 0;
		transform: rotateX(-180deg);
	}

	#copy-button {
		font-weight: 500;
		margin-left: 2%;
		padding: 0.5rem;
		padding-inline: 0.8rem;
		font-size: 0.85rem;
		outline: none;
		border: 0;
		border-radius: 4%;
		background-color: var(--bg-2);
		color: var(--text-2);
		box-shadow: var(--shadow-medium-high);
		transition: all 80ms ease;
		cursor: pointer;
	}

	#copy-button:active {
		transform: translateY(5%);
		box-shadow: var(--shadow-lowered);
	}

	#theme-switcher {
		position: fixed;
		bottom: 1rem;
		left: calc(50% - 2rem);
		background-color: var(--bg);
		width: 4rem;
		height: 4rem;
		border: 0;
		border-radius: 2rem;
		opacity: 0.3;
		backdrop-filter: blur(5px); /* Supported in Chrome 76 */

		display: grid;
		place-items: center;

		cursor: pointer;

		transition: all 200ms ease;
	}

	#theme-switcher svg {
		width: 2rem;
		height: auto;
		fill: var(--text-2);
	}

	#theme-switcher:hover {
		opacity: 0.7;
	}

	/* lol */
	#copy-area {
	    position: absolute;
	    pointer-events: none;
	    opacity: 0;
	    width: 1rem;
	    height: 1rem;
	    margin: 0;
	    padding: 0;
	    border: none;
	}

	#error-indicator {
		position: fixed;
		width: 50%;
		left: 25%;
		bottom: 1rem;
		background-color: #ff4d2e;
		box-shadow: var(--shadow-raised);
		display: grid;
		place-items: center;
		/* padding: 0.8rem; */
		border-radius: 0.2rem;
	}

	#error-indicator p {
		font-family: 'Roboto', sans-serif;
		font-weight: 400;
		font-size: 1rem;
		margin-top: 0.8rem;
		margin-bottom: 0.8rem;
		text-align: center;
		color: var(--text-2);
	}

	a {
		font-size: 0.8rem;
		font-weight: 400;
		color: #ab9eff;
		margin-bottom: 0.4rem;
	}

	@media only screen and (max-width: 840px) {
		main {
			left: 0;
			width: calc(100% - 1rem);
			padding-right: 0.5rem;
			padding-left: 0.5rem;
		}
		p {
			margin-bottom: 2rem;
		}
		#error-indicator {
			width: 90%;
			left: 5%;
		}

		.tooltip {
			max-width: 100%;
		}

		.wrapper:hover .tooltip {
			bottom: 100%;
		}

		input:focus + .tooltip {
			bottom: 100%;
		}
	}
</style>
