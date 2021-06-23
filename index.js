var axios = require('axios');
var sodium = require('tweetsodium');

const GITHUB_API = 'https://api.github.com';
const REQUIRED_KEYS = ['githubUsername', 'githubRepo', 'githubToken'];

module.exports = class SimpleGitHubSecrets {
    constructor(config) {
        this.validateConfig(config);
        this.config = config;
        this.axios = this.buildAxiosClient()
    }

    validateConfig(config) {
        if (typeof config !== 'object') {
            throw new Error('config was not an object.');
        }

        REQUIRED_KEYS.forEach((key) => {
            if (!config.hasOwnProperty(key)) {
                throw new Error(`Missing required property ${key}`);
            }
            var value = config[key];
            if (typeof value !== 'string') {
                throw new Error(`Property ${key} must be a string.`);
            }
            if (value === '') {
                throw new Error(`Property ${key} must not be blank.`);
            }
        });
    }

    buildAxiosClient() {
        return axios.create({
            baseURL: GITHUB_API,
            timeout: 1000,
            headers: {
                Accept: "application/vnd.github.v3+json",
                'Content-Type': "application/json",
                Authorization: 'Basic ' + Buffer.from(this.config.githubUsername + ':' + this.config.githubToken).toString('base64')
            }
        });
    }

    async update(secrets) {
        var public_key = await this.getPublicKey();

        var names = Object.keys(secrets);
        names.forEach(async (name) => {
            var encrypted = this.encryptSecret(secrets[name], public_key.key);
            await this.updateSecretValue(name, encrypted, public_key.key_id)
        });
    }

    getRepoUrl() {
        return `/repos/${this.config.githubUsername}/${this.config.githubRepo}`;
    }

    async getPublicKey() {
        var url = this.getRepoUrl() + `/actions/secrets/public-key`;
        var response;
        try {
            response = await this.axios.get(url);
        } catch (e) {
            throw new Error('Failed to fetch GitHub user public key.');
        }
    
        return response.data;
    }

    async updateSecretValue(name, encrypted, keyId) {
        var url = this.getRepoUrl() + `/actions/secrets/${name}`;
        var data = JSON.stringify({
            encrypted_value: encrypted,
            key_id: keyId
        });
        try {
            await this.axios.put(url, data);
        } catch (e) {
            throw new Error(`Failed to update ${name}`);
        }
    }

    encryptSecret(secret, publicKey) {
        var message_bytes = Buffer.from(secret);
        var key_bytes = Buffer.from(publicKey, 'base64');

        var encrypted_bytes = sodium.seal(message_bytes, key_bytes);
    
        return Buffer.from(encrypted_bytes).toString('base64');
    }
}