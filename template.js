module.exports = (script, description, environments, workingDirectory, npmScript) => {
  console.log(environments)
  environments = environments
    .map(environment => `Environment=${environment}`)
    .join('\r\n')
  environments += environments.trim().length > 0 ? '\r\n' : ''
  return `[Unit]
Description=${description}
After=network.target

[Service]
${environments}User=${require('os').userInfo().username}
WorkingDirectory=${workingDirectory}
ExecStart=${npmScript}/npm run ${script}
Restart=always
RestartSec=100ms
StartLimitInterval=0

[Install]
WantedBy=multi-user.target`
}