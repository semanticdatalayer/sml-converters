import fs from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Validates GitHub repository URL and extracts branch if specified
 */
export function parseRepoUrl(url: string): { url: string; branch?: string } {
  const githubUrlPattern = /^https:\/\/github\.com\/[\w\-_.]+\/[\w\-_.]+(?:\.git)?$/;
  const githubBranchPattern = /^https:\/\/github\.com\/([\w\-_.]+)\/([\w\-_.]+)\/tree\/([\w\-_.\/]+)$/;
  
  // Check if URL includes branch reference
  const branchMatch = url.match(githubBranchPattern);
  if (branchMatch) {
    const [, owner, repo, branch] = branchMatch;
    return {
      url: `https://github.com/${owner}/${repo}.git`,
      branch: branch
    };
  }
  
  // Standard repo URL
  if (githubUrlPattern.test(url)) {
    return { url };
  }
  
  throw new Error('Invalid GitHub repository URL');
}

/**
 * Ensures the local directory exists and is empty or creates it
 */
export async function prepareLocalDirectory(localPath: string, clean: boolean = false): Promise<void> {
  try {
    // Check if directory exists
    const stats = await fs.stat(localPath);
    if (stats.isDirectory()) {
      // Check if directory is empty
      const files = await fs.readdir(localPath);
      if (files.length > 0) {
        if (clean) {
          // Remove all files and subdirectories
          await fs.rm(localPath, { recursive: true, force: true });
          // Recreate the directory
          await fs.mkdir(localPath, { recursive: true });
        } else {
          throw new Error(`Directory ${localPath} is not empty`);
        }
      }
    }
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // Directory doesn't exist, create it
      await fs.mkdir(localPath, { recursive: true });
    } else {
      throw error;
    }
  }
}

/**
 * Removes a directory at the specified path
 * @param dirPath - The path to the directory to remove
 * @param options - Optional configuration for removal
 * @returns Promise that resolves when directory is removed
 */
export async function removeDirectory(
  dirPath: string,
  options: { force?: boolean; recursive?: boolean } = {}
): Promise<void> {
  const { force = false, recursive = true } = options;
  
  try {
    // Check if directory exists before attempting removal
    if (!existsSync(dirPath)) {
      if (!force) {
        throw new Error(`Directory does not exist: ${dirPath}`);
      }
      return; // Silently return if force is true and directory doesn't exist
    }

    // Remove the directory and all its contents
    await fs.rm(dirPath, { 
      recursive, 
      force 
    });
    
    console.log(`Directory removed successfully: ${dirPath}`);
  } catch (error) {
    throw new Error(`Failed to remove directory ${dirPath}: ${error}`);
  }
}

// /**
//  * Creates a unique temporary directory within the specified base directory.
//  * If a directory with the generated name already exists, the function recursively
//  * increments a numeric suffix until an unused directory name is found.
//  *
//  * @param baseDir - The base directory in which to create the temporary directory. Defaults to the current working directory if not provided.
//  * @param tempNum - An optional numeric suffix to append to the directory name. Used internally for recursion to ensure uniqueness.
//  * @returns The path to the newly created temporary directory.
//  */
// function createTempDir(baseDir?: string, tempNum?: number): string {
//   const tempDir = path.join(baseDir || process.cwd(), `temp${tempNum || ""}`);
//   if (!fsSync.existsSync(tempDir)) {
//     fsSync.mkdirSync(tempDir);
//   } else {
//     return createTempDir(baseDir, (tempNum || 0) + 1);
//   }
//   return tempDir;
// }