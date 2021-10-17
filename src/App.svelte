<script>
	import { fade, fly } from "svelte/transition";
	import generateWiggle from './wiggle.js';

	let text = '';
	let wiggleRate = "0.2";
	let lineLength = "50";
	let lineCount = "500";

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
	<button type="button" name="button" on:click={copyOutput}>{copyButtonText}</button>
	<div id="output-wrapper">
		<p id="output" contenteditable="false" >{output}</p>
	</div>

	<textarea id="copy-area" class="i-not-exists">{output}</textarea>
	<a href="https://github.com/arj101/wiggle-generator-js">View source code on Github</a>
</main>

{#if error}
  <div id="error-indicator" in:fly={{ y: 100, duration: 150}} out:fly={{ y: 100, duration: 200}}>
	<p>{error}</p>
  </div>
{/if}

<style>
	:global(body) {
		background-color: #3B7455;
		padding: 0;
	}
	main {
		background-color: rgba(31, 31, 31, 0.87);
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
		color:#69DC9E;
		text-transform: uppercase;
	}

	p {
		width: 80%;
		margin: 0;
		margin-inline-start: 2%;
		margin-bottom: 3%;
		font-weight: 300;
		font-size: 0.95rem;
		color: rgba(255, 255, 255, 0.856);
	}

	label {
		color:rgb(255, 255, 255);
		font-weight: 300;
		font-size: 0.9rem;
		margin-bottom: 2px;
	}

	input {
		position: relative;
		background-color: rgba(0, 0, 0, 0);
		color:rgb(255, 255, 255);
		border-width: 0.2rem;
		transition: all 300ms ease;
		border: 2px solid #69DC9E;
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
		width: 100%;
		outline: 1px solid #d6ffe900;
	}


	input:hover {
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.4);
	}

	input:focus {
		box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.4);
		transform: translateY(-2%);
		border-color:rgba(0, 0, 0, 0);
		outline: 1px solid #69DC9E;
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
		color: white;
		background-color: #3B7455;
		padding: 0.2rem;
		padding-right: 0.5rem;
		padding-left: 0.5rem;
		font-size: 0.8rem;
		border-radius: 0.2rem;
		box-shadow: 0px 5px 15px rgba(0, 0, 0, 0.5);

		display:-moz-marker;
		position: absolute;
		right: 0%;
		bottom: 50%;
		text-align:left;

		opacity: 0;
		pointer-events: none;

		transition: all 100ms ease-in-out;
		max-width: 60%;

		opacity: 0.5;
		backdrop-filter: blur(10px);
	}

	.wrapper:hover .tooltip {
		bottom: 80%;
		opacity: 1;
		pointer-events: all;
	}

	input:focus + .tooltip {
		bottom: 80%;
		opacity: 1;
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
		background-color: rgba(31, 31, 31);
		border-radius: 0.2em;
	}

	#output-wrapper::-webkit-scrollbar-thumb {
	  background-color: #3B7455;
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

	button {
		font-weight: 500;
		margin-left: 2%;
		padding: 0.5rem;
		padding-inline: 0.8rem;
		font-size: 0.85rem;
		outline: none;
		border: 0;
		border-radius: 4%;
		background-color: #3B7455;
		color: rgba(255, 255, 255, 1);
		box-shadow: 0px 4px 8px rgba(0, 0, 0, 0.2);
		transition: all 80ms ease;
		cursor: pointer;
	}

	button:active {
		transform: translateY(5%);
		box-shadow: 0px 2px 4px rgba(0, 0, 0, 0.2);
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
		box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.4);
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
			margin-bottom: 1rem;
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
