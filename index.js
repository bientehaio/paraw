#!/usr/bin/env node
const inquirer = require('inquirer')
const fs       = require('fs')
const chalk    = require('chalk')
const template = require('./template')
const path     = require('path')
try {
  const argv = require('yargs')
    .command('start [package]', 'generate systemd service file', (yargs) => {
      return yargs
        .option('confirm', {
          default: false
        })
        .option('systemd-dir', {
          default: '/etc/systemd/system'
        })
        .option('service-file', {})
    }, async (argv) => {
      const packageFile      = path.resolve(argv.package || 'package.json')
      const workingDirectory = path.dirname(packageFile) === '.' ? __dirname : path.dirname(packageFile)
      let packageJson        = null
      try {
        packageJson = require(packageFile)
      } catch (ex) {
        console.log(chalk.redBright('[ERROR] package.json not found.'))
        return
      }
      const npmScript   = require('child_process').execSync('npm bin -g').toString().trim()
      const description = packageJson.description || packageJson.name
      if (!packageJson.scripts) {
        console.log(chalk.redBright('[ERROR] package.json have not any scripts.'))
        return
      }
      console.log(chalk.yellow('Start generating for %s'), packageJson.name)

      const result       = await inquirer.prompt({
        type   : 'list',
        name   : 'script',
        message: 'Which script you want to run ?',
        choices: Object.keys(packageJson.scripts)
      })
      const fullScript   = packageJson.scripts[result.script]
      const environments = fullScript.split(' ').filter(part => part.includes('='))
      const service      = template(result.script, description, environments, workingDirectory, npmScript)
      const serviceName  = argv.serviceFile || packageJson.name
      const servicePath  = path.resolve(`${argv.systemdDir}/${serviceName}.service`)

      const createService = () => {
        try {
          fs.writeFileSync(servicePath, service, 'ascii')
          console.log(chalk.greenBright('Service successfully created on ', servicePath))
          console.log(chalk.whiteBright(`Run 'sudo systemctl enable ${serviceName}'`))
          console.log(chalk.whiteBright(`Run 'sudo systemctl start ${serviceName}'`))
        } catch (ex) {
          if (ex.code.toString() === 'EACCES') {
            console.log(chalk.redBright('[EACCES ERROR] Please run Paraw with sudo'))
            return
          }
          console.log(chalk.redBright('[ERROR] ', ex.message))
        }
      }
      if (argv.confirm) {
        console.log(chalk.cyan('Script info for %s'), packageJson.name)
        console.log('')

        console.log(chalk.keyword('orange')('Service'))
        console.log(chalk.green(`${packageJson.name.trim()}.service`))
        console.log('')

        console.log(chalk.keyword('orange')('Description'))
        console.log(chalk.green())
        console.log('')

        console.log(chalk.keyword('orange')('Script'))
        console.log(chalk.green(fullScript.trim()))
        console.log('')

        console.log(chalk.keyword('orange')('Environment Variables'))
        environments.forEach(environment => {
          console.log(chalk.green(environment))
        })
        console.log('')

        console.log(chalk.keyword('orange')('Working Directory'))
        console.log(chalk.green(workingDirectory))
        console.log('')

        console.log(chalk.keyword('orange')('Npm Script'))
        console.log(chalk.green(npmScript))
        console.log('')
        const confirm = await inquirer.prompt({
          type   : 'confirm',
          name   : 'ok',
          message: 'This script is ok?',
          default: true
        })
        if (confirm.ok) {
          createService()
        }
      } else {
        createService()
      }
    })
    .demandCommand()
    .help()
    .wrap(100)
    .argv
} catch (ex) {
  console.log(ex)
}