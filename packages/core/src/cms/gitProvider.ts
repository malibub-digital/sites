export interface GitFileChange {
  path: string;
  content: string;
}

export interface GitPublishPayload {
  owner: string;
  repo: string;
  branch: string;
  commitMessage: string;
  files: GitFileChange[];
  token: string;
  apiUrl?: string;
}

export interface GitProvider {
  publish(payload: GitPublishPayload): Promise<{ success: boolean; message: string; commitSha?: string }>;
}

export class GitHubProvider implements GitProvider {
  async publish(payload: GitPublishPayload): Promise<{ success: boolean; message: string; commitSha?: string }> {
    const baseUrl = payload.apiUrl || 'https://api.github.com';
    const { owner, repo, branch, commitMessage, files, token } = payload;

    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'MaliHub-Sites-CMS',
    };

    // 1. Obtenir la référence de la branche (SHA du dernier commit)
    const refRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/ref/heads/${branch}`, { headers });
    if (!refRes.ok) {
      const errText = await refRes.text();
      throw new Error(`[GitHubProvider] Impossible de récupérer la référence de la branche '${branch}': ${refRes.status} ${errText}`);
    }
    const refData = (await refRes.json()) as { object: { sha: string } };
    const latestCommitSha = refData.object.sha;

    // 2. Obtenir le commit parent pour récupérer son tree SHA
    const commitRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, { headers });
    if (!commitRes.ok) {
      throw new Error(`[GitHubProvider] Impossible de récupérer le commit parent (${latestCommitSha})`);
    }
    const commitData = (await commitRes.json()) as { tree: { sha: string } };
    const baseTreeSha = commitData.tree.sha;

    // 3. Créer un nouveau Tree contenant les modifications de fichiers
    const treeItems = files.map((f) => ({
      path: f.path,
      mode: '100644',
      type: 'blob',
      content: f.content,
    }));

    const createTreeRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });

    if (!createTreeRes.ok) {
      const errText = await createTreeRes.text();
      throw new Error(`[GitHubProvider] Échec création de l'arbre Git: ${createTreeRes.status} ${errText}`);
    }
    const treeData = (await createTreeRes.json()) as { sha: string };
    const newTreeSha = treeData.sha;

    // 4. Créer le commit
    const createCommitRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: commitMessage,
        tree: newTreeSha,
        parents: [latestCommitSha],
      }),
    });

    if (!createCommitRes.ok) {
      const errText = await createCommitRes.text();
      throw new Error(`[GitHubProvider] Échec création du commit Git: ${createCommitRes.status} ${errText}`);
    }
    const newCommitData = (await createCommitRes.json()) as { sha: string };
    const newCommitSha = newCommitData.sha;

    // 5. Mettre à jour la référence de la branche (Push)
    const updateRefRes = await fetch(`${baseUrl}/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        sha: newCommitSha,
        force: false,
      }),
    });

    if (!updateRefRes.ok) {
      const errText = await updateRefRes.text();
      throw new Error(`[GitHubProvider] Échec mise à jour référence de branche: ${updateRefRes.status} ${errText}`);
    }

    return {
      success: true,
      message: `Modifications publiées avec succès sur GitHub via l'API (Commit: ${newCommitSha.substring(0, 7)}).`,
      commitSha: newCommitSha,
    };
  }
}

export function getGitProvider(providerType: string = 'github'): GitProvider {
  switch (providerType.toLowerCase()) {
    case 'github':
      return new GitHubProvider();
    default:
      throw new Error(`[GitProvider] Provider Git non supporté: '${providerType}'`);
  }
}
