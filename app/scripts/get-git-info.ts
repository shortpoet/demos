import * as git from 'git-last-commit';

export default function getGitInfo(): Promise<string> {
  return new Promise((resolve, reject) => {
    git.getLastCommit(function (err, commit) {
      if (err) {
        console.error(err);
        reject(err);
      }
      // sanitize
      // there may be other edge cases like newlines. see repo issues
      // https://github.com/seymen/git-last-commit/issues
      const commitStr = JSON.stringify(commit).replace(/'/g, '"');
      resolve(commitStr);
    });
  });
}
