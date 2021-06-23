## Usage
```js
var SimpleGitHubSecrets = require('simple-github-secrets');

var secrets = new SimpleGitHubSecrets({
    githubUsername: 'your-username',
    githubRepo: 'your-repo',
    githubToken: 'xxx'
});

secrets.update({
    TEST: 'new value'
});
```