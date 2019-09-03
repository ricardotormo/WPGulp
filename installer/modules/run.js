/**
 * Install WPGulp
 */

const fs = require('fs');
const theCWD = process.cwd();
const theCWDArray = theCWD.split('/');
const theDir = theCWDArray[theCWDArray.length - 1];
const ora = require('ora');
const execa = require('execa');
const chalk = require('chalk');
const download = require('download');
const handleError = require('./handleError.js');
const clearConsole = require('./clearConsole.js');
const printNextSteps = require('./printNextSteps.js');
const prompts = require('prompts');
const execDownload = (filesToDownload) => {

	const spinner = ora({ text: '' });
	spinner.start(`1. Creating WPGulp files inside → ${chalk.black.bgWhite(` ${theDir} `)}`);
	// Download.
	return Promise.all(filesToDownload.map(x => download(x, `${theCWD}`))).then(async () => {
		spinner.succeed();

		// The npm install.
		spinner.start('2. Installing npm packages...');
		// await execa('npm', ['install', '--silent']);
		await execa('npm', ['install']);
		spinner.succeed();

		// Done.
		printNextSteps();
	});
}

module.exports = () => {
	(async () => {
		const files = {
			gulpFile: "https://raw.githubusercontent.com/ricardotormo/WPGulp/master/src/gulpfile.babel.js",
			configFile: "https://raw.githubusercontent.com/ricardotormo/WPGulp/master/src/wpgulp.config.js",
			packageJSONFile: "https://raw.githubusercontent.com/ricardotormo/WPGulp/master/src/package.json"
		};
		const questions = [
			{
				type: 'select',
				name: 'value',
				message: 'What do you want to do?',
				choices: [
					{ title: 'Upgrade', value: 'upgrade' },
					{ title: 'Install', value: 'install' },
				],
				initial: 1
			}
		];
		const onSubmit = (prompt, response) => {
			return response;
		}
		const response = await prompts(questions, { onSubmit });

		// Init.
		clearConsole();

		// Start.
		console.log('\n'); // eslint-disable-line no-console
		console.log(
			'📦 ',
			chalk.black.bgYellow(` Downloading WPGulp files in: → ${chalk.bgGreen(` ${theDir} `)}\n`),
			chalk.dim(`\n In the directory: ${theCWD}\n`),
			chalk.dim('This might take a couple of minutes.\n')
		);

		if (response.value === "upgrade") {
			execDownload([files.gulpFile, files.packageJSONFile])
		}
		else if (response.value === "install") {
			execDownload([files.gulpFile, files.packageJSONFile, files.configFile])
		}
	})();
};