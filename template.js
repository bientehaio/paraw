module.exports = (script, description, environments, workingDirectory, npmScript) => {
  environments = environments
    .map(environment => `Environment=${environment}`)
    .join('\r\n')
  return `[Unit]
Description=${description}
After=network.target

[Service]
${environments + environments.length > 0 ? '\r\n' : ''}User=${require('os').userInfo().username}
WorkingDirectory=${workingDirectory}
ExecStart=${npmScript}/npm run ${script}
Restart=always
RestartSec=100ms
StartLimitInterval=0

[Install]
WantedBy=multi-user.target`
}