#!/usr/bin/env node

// Check node version before requiring/doing anything else
// The user may be on a very old node version

const chalk = require('chalk') //  给控制台打印添加颜色工具
const semver = require('semver') // 检查 各个包的版本工具
const requiredVersion = require('../package.json').engines.node

function checkNodeVersion (wanted, id) { // 检查环境版本号是否满足代码需要允许的版本
  // process.version 系统版本
  if (!semver.satisfies(process.version, wanted)) {
    console.log(chalk.red(
      'You are using Node ' + process.version + ', but this version of ' + id +
      ' requires Node ' + wanted + '.\nPlease upgrade your Node version.'
    ))
    // 不满足就退出
    process.exit(1)
  }
}

// 执行检查
checkNodeVersion(requiredVersion, 'vue-cli')

const fs = require('fs')
const path = require('path')
const slash = require('slash') // 将Windows反斜杠路径转换为斜杠路径 工具库
const minimist = require('minimist') // 格式化入参
// var argv = require('minimist')(process.argv.slice(2));
// console.dir(argv);
// $ node example/parse.js -a beep -b boop
// { _: [], a: 'beep', b: 'boop' }

// enter debug mode when creating test repo
// 创建测试仓库时进入调试模式
if (
  slash(process.cwd()).indexOf('/packages/test') > 0 && (
    fs.existsSync(path.resolve(process.cwd(), '../@vue')) ||
    fs.existsSync(path.resolve(process.cwd(), '../../@vue'))
  )
) {
  process.env.VUE_CLI_DEBUG = true
}

//node 命令行程序的解决方案
const program = require('commander')
// 导入全局包的公共方法
const loadCommand = require('../lib/util/loadCommand')

program
  .version(require('../package').version)
  .usage('<command> [options]') // 用法提示

program
  .command('create <app-name>') // 创建应用命令
  .description('create a new project powered by vue-cli-service') // 创建一个由 vue-cli-service 支持的新项目
  .option('-p, --preset <presetName>', 'Skip prompts and use saved or remote preset') // 跳过询问提示 直接使用本地或者远端的预配置
  .option('-d, --default', 'Skip prompts and use default preset') //  跳过询问提示，使用默认预设
  .option('-i, --inlinePreset <json>', 'Skip prompts and use inline JSON string as preset') // 跳过询问使用内联json 作为预设
  .option('-m, --packageManager <command>', 'Use specified npm client when installing dependencies') // 安装依赖版本时实用指定的 npm 客户端
  .option('-r, --registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')// 安装依赖时使用指定的 npm 源
  .option('-g, --git [message]', 'Force git initialization with initial commit message') // 使用初始提交信息强制 git 初始化 
  .option('-n, --no-git', 'Skip git initialization') // 跳过 git 初始化
  .option('-f, --force', 'Overwrite target directory if it exists')// 覆盖已经存在的目标文件夹
  .option('-c, --clone', 'Use git clone when fetching remote preset') // 从远端拉去预设时使用 git clone 命令
  .option('-x, --proxy', 'Use specified proxy when creating project')  // 使用代理创建项目
  .option('-b, --bare', 'Scaffold project without beginner instructions') // 没有初学者指导的脚手架项目
  .action((name, cmd) => {
    const options = cleanArgs(cmd) // 格式化入参
    // --no-git makes commander to default git to true
    // 设置强制使用git 初始化信息
    if (process.argv.includes('-g') || process.argv.includes('--git')) {
      options.forceGit = true
    }
    require('../lib/create')(name, options) // 执行创建命令
  })

program
  .command('add <plugin> [pluginOptions]')
  .description('install a plugin and invoke its generator in an already created project')
  .option('--registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .allowUnknownOption()
  .action((plugin) => {
    require('../lib/add')(plugin, minimist(process.argv.slice(3)))
  })

program
  .command('invoke <plugin> [pluginOptions]')
  .description('invoke the generator of a plugin in an already created project')
  .option('--registry <url>', 'Use specified npm registry when installing dependencies (only for npm)')
  .allowUnknownOption()
  .action((plugin) => {
    require('../lib/invoke')(plugin, minimist(process.argv.slice(3)))
  })

program
  .command('inspect [paths...]')
  .description('inspect the webpack config in a project with vue-cli-service')
  .option('--mode <mode>')
  .option('--rule <ruleName>', 'inspect a specific module rule')
  .option('--plugin <pluginName>', 'inspect a specific plugin')
  .option('--rules', 'list all module rule names')
  .option('--plugins', 'list all plugin names')
  .option('-v --verbose', 'Show full function definitions in output')
  .action((paths, cmd) => {
    require('../lib/inspect')(paths, cleanArgs(cmd))
  })

program
  .command('serve [entry]')
  .description('serve a .js or .vue file in development mode with zero config')
  .option('-o, --open', 'Open browser')
  .option('-c, --copy', 'Copy local url to clipboard')
  .action((entry, cmd) => {
    loadCommand('serve', '@vue/cli-service-global').serve(entry, cleanArgs(cmd))
  })

program
  .command('build [entry]')
  .description('build a .js or .vue file in production mode with zero config')
  .option('-t, --target <target>', 'Build target (app | lib | wc | wc-async, default: app)')
  .option('-n, --name <name>', 'name for lib or web-component mode (default: entry filename)')
  .option('-d, --dest <dir>', 'output directory (default: dist)')
  .action((entry, cmd) => {
    loadCommand('build', '@vue/cli-service-global').build(entry, cleanArgs(cmd))
  })

program
  .command('ui')
  .description('start and open the vue-cli ui')
  .option('-H, --host <host>', 'Host used for the UI server (default: localhost)')
  .option('-p, --port <port>', 'Port used for the UI server (by default search for available port)')
  .option('-D, --dev', 'Run in dev mode')
  .option('--quiet', `Don't output starting messages`)
  .option('--headless', `Don't open browser on start and output port`)
  .action((cmd) => {
    checkNodeVersion('>=8.6', 'vue ui')
    require('../lib/ui')(cleanArgs(cmd))
  })

program
  .command('init <template> <app-name>')
  .description('generate a project from a remote template (legacy API, requires @vue/cli-init)')
  .option('-c, --clone', 'Use git clone when fetching remote template')
  .option('--offline', 'Use cached template')
  .action(() => {
    loadCommand('init', '@vue/cli-init')
  })

program
  .command('config [value]')
  .description('inspect and modify the config')
  .option('-g, --get <path>', 'get value from option')
  .option('-s, --set <path> <value>', 'set option value')
  .option('-d, --delete <path>', 'delete option from config')
  .option('-e, --edit', 'open config with default editor')
  .option('--json', 'outputs JSON result only')
  .action((value, cmd) => {
    require('../lib/config')(value, cleanArgs(cmd))
  })

program
  .command('upgrade [semverLevel]')
  .description('upgrade vue cli service / plugins (default semverLevel: minor)')
  .action((semverLevel, cmd) => {
    loadCommand('upgrade', '@vue/cli-upgrade')(semverLevel, cleanArgs(cmd))
  })

// output help information on unknown commands
program
  .arguments('<command>')
  .action((cmd) => {
    program.outputHelp()
    console.log(`  ` + chalk.red(`Unknown command ${chalk.yellow(cmd)}.`))
    console.log()
  })

// add some useful info on help
program.on('--help', () => {
  console.log()
  console.log(`  Run ${chalk.cyan(`vue <command> --help`)} for detailed usage of given command.`)
  console.log()
})

program.commands.forEach(c => c.on('--help', () => console.log()))

// enhance common error messages
const enhanceErrorMessages = require('../lib/util/enhanceErrorMessages')

enhanceErrorMessages('missingArgument', argName => {
  return `Missing required argument ${chalk.yellow(`<${argName}>`)}.`
})

enhanceErrorMessages('unknownOption', optionName => {
  return `Unknown option ${chalk.yellow(optionName)}.`
})

enhanceErrorMessages('optionMissingArgument', (option, flag) => {
  return `Missing required argument for option ${chalk.yellow(option.flags)}` + (
    flag ? `, got ${chalk.yellow(flag)}` : ``
  )
})

program.parse(process.argv)

if (!process.argv.slice(2).length) {
  program.outputHelp()
}

function camelize (str) {
  return str.replace(/-(\w)/g, (_, c) => c ? c.toUpperCase() : '')
}

// commander passes the Command object itself as options,
// extract only actual options into a fresh object.
function cleanArgs (cmd) {
  const args = {}
  cmd.options.forEach(o => {
    const key = camelize(o.long.replace(/^--/, ''))
    // if an option is not present and Command has a method with the same name
    // it should not be copied
    if (typeof cmd[key] !== 'function' && typeof cmd[key] !== 'undefined') {
      args[key] = cmd[key]
    }
  })
  return args
}
