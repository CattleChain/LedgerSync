const config = {
    VALIDATOR_URL: process.env.VALIDATOR_URL || 'tcp://localhost:4004',
    CONTEXT_BROKER: process.env.CONTEXT_BROKER || 'http://localhost:1026',
}

module.exports = {
    config
}