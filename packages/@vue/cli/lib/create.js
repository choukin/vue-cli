const fs = require('fs-extra') // fs 模块的扩展
const path = require('path')
const chalk = require('chalk')
const inquirer = require('inquirer')
const Creator = require('./Creator')
const { clearConsole } = require('./util/clearConsole')
const { getPromptModules } = require('./util/createTools') // 创建模块工具
const { error, stopSpinner, exit } = require('@vue/cli-shared-utils')
const validateProjectName = require('validate-npm-package-name')

async function create (projectName, options) {
  // 是否有代理
  if (options.proxy) {
    process.env.HTTP_PROXY = options.proxy
  }
  // 当前目录
  const cwd = options.cwd || process.cwd()
  //是否在当前文件创建
  const inCurrent = projectName === '.'
  // 获取项目名称
  const name = inCurrent ? path.relative('../', cwd) : projectName
  // 获取目标文件夹
  const targetDir = path.resolve(cwd, projectName || '.')
  // 校验项目名称是否是一个npm包名
  const result = validateProjectName(name)

  if (!result.validForNewPackages) {
    console.error(chalk.red(`Invalid project name: "${name}"`))
    result.errors && result.errors.forEach(err => {
      console.error(chalk.red(err))
    })
    exit(1)
  }
   // 判断目录是否已经存在
  if (fs.existsSync(targetDir)) {
    if (options.force) { // 覆盖已经存在的目录
      await fs.remove(targetDir)
    } else {
      await clearConsole()
      if (inCurrent) { // 在当前文件夹内创建
        const { ok } = await inquirer.prompt([
          {
            name: 'ok',
            type: 'confirm',
            message: `Generate project in current directory?`
          }
        ])
        if (!ok) {
          return
        }
      } else { // 在已经存在的文件夹内创建
        const { action } = await inquirer.prompt([
          {
            name: 'action',
            type: 'list',
            message: `Target directory ${chalk.cyan(targetDir)} already exists. Pick an action:`,
            choices: [
              { name: 'Overwrite', value: 'overwrite' },
              { name: 'Merge', value: 'merge' },
              { name: 'Cancel', value: false }
            ]
          }
        ])
        if (!action) {
          return
        } else if (action === 'overwrite') { // 覆盖
          console.log(`\nRemoving ${chalk.cyan(targetDir)}...`)
          await fs.remove(targetDir)
        }
      }
    }
  }

  // 声明一个创造器
  const creator = new Creator(name, targetDir, getPromptModules())
  // 执行创建方法
  await creator.create(options)
}

module.exports = (...args) => {
  return create(...args).catch(err => {
    stopSpinner(false) // do not persist
    error(err)
    if (!process.env.VUE_CLI_TEST) {
      process.exit(1)
    }
  })
}
