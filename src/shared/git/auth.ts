import { GitHubAuth } from './types';
/**
 * Converts authentication config to isomorphic-git onAuth callback
 */
export function createAuthCallback(auth: GitHubAuth) {
  return () => {
    switch (auth.type) {
      case 'username-password':
        return {
          username: auth.username,
          password: auth.password,
        };
      case 'token':
      case 'fine-grained-token':
      case 'oauth':
        return {
          username: auth.token,
          password: 'x-oauth-basic', // GitHub token auth format
        };
      default:
        throw new Error('Invalid authentication type');
    }
  };
}

/**
 * Validates token format and provides helpful error messages
 */
// eslint-disable-next-line @typescript-eslint/require-await
export async function validateTokenFormat(auth: GitHubAuth): Promise<{ valid: boolean; message?: string }> {
  switch (auth.type) {
    case 'token':
      if (!auth.token.startsWith('ghp_')) {
        return {
          valid: false,
          message: 'Classic personal access tokens should start with "ghp_"'
        };
      }
      break;
    case 'fine-grained-token':
      if (!auth.token.startsWith('github_pat_')) {
        return {
          valid: false,
          message: 'Fine-grained personal access tokens should start with "github_pat_"'
        };
      }
      break;
    case 'oauth':
      if (!auth.token.startsWith('gho_')) {
        return {
          valid: false,
          message: 'OAuth access tokens should start with "gho_"'
        };
      }
      break;
  }
  
  return { valid: true };
}

/**
 * Tests authentication by making a minimal request to GitHub API
 */
export async function testAuthentication(auth: GitHubAuth): Promise<boolean> {
  try {
    // First validate token format
    const formatCheck = await validateTokenFormat(auth);
    if (!formatCheck.valid) {
      console.error('Token format validation failed:', formatCheck.message);
      return false;
    }

    const headers: Record<string, string> = {
      'User-Agent': 'isomorphic-git-client',
    };

    switch (auth.type) {
      case 'token':
      case 'fine-grained-token':
      case 'oauth':
        headers['Authorization'] = `Bearer ${auth.token}`;
        break;
      case 'username-password':
        const credentials = Buffer.from(`${auth.username}:${auth.password}`).toString('base64');
        headers['Authorization'] = `Basic ${credentials}`;
        break;
    }

    const response = await fetch('https://api.github.com/user', {
      headers,
    });

    return response.ok;
  } catch (error) {
    console.error('Authentication test failed:', error);
    return false;
  }
}