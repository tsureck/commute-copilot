# Security Best Practices

## Environment Variables & Secrets

**⚠️ Important:** If you're sharing your workspace with LLMs (like Cursor AI), they can read **all files** in the workspace, including `.env` files, even if they're gitignored.

### Recommended Approach: Use Terminal/IDE Environment Variables

Instead of keeping secrets in `.env` files, use environment variables set in your terminal or IDE:

#### Option 1: Terminal Environment Variables (Recommended)

**Windows (PowerShell):**
```powershell
$env:SUPABASE_URL="https://your-project.supabase.co"
$env:SUPABASE_KEY="your-key-here"
$env:N8N_WEBHOOK_BASE_URL="https://your-n8n.app.n8n.cloud/webhook"
npm run dev
```

**Windows (CMD):**
```cmd
set SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_KEY=your-key-here
set N8N_WEBHOOK_BASE_URL=https://your-n8n.app.n8n.cloud/webhook
npm run dev
```

**macOS/Linux:**
```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_KEY="your-key-here"
export N8N_WEBHOOK_BASE_URL="https://your-n8n.app.n8n.cloud/webhook"
npm run dev
```

#### Option 2: IDE Settings (Cursor/VSCode)

Create `.vscode/settings.json` (already gitignored):

```json
{
  "terminal.integrated.env.windows": {
    "SUPABASE_URL": "https://your-project.supabase.co",
    "SUPABASE_KEY": "your-key-here",
    "N8N_WEBHOOK_BASE_URL": "https://your-n8n.app.n8n.cloud/webhook"
  }
}
```

**Note:** `.vscode/` is in `.gitignore`, so this won't be committed.

#### Option 3: Use `.env.local` (Less Secure)

If you must use a file, use `.env.local` (also gitignored):

```bash
# Copy example
cp .env.example .env.local

# Edit .env.local with your secrets
# ⚠️ Warning: LLMs can still read this if it's in your workspace
```

**Risk:** If you share your workspace with LLMs, they can read `.env.local` too.

### For Production Deployment

**Never commit secrets to git.** Use:

- **Railway/Render**: Set environment variables in dashboard
- **Vercel**: Set in project settings → Environment Variables
- **n8n Cloud**: Set in Settings → Environment Variables

### What's Safe to Commit?

✅ **Safe:**
- `.env.example` (no real secrets, just placeholders)
- Code files
- Documentation

❌ **Never commit:**
- `.env` (real secrets)
- `.env.local` (real secrets)
- API keys, passwords, tokens
- Database connection strings with passwords

### If You Accidentally Committed Secrets

1. **Immediately rotate/revoke** the exposed secrets:
   - Generate new Supabase keys
   - Generate new Gemini API key
   - Update n8n webhook URLs

2. **Remove from git history:**
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch backend/api/.env" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **Force push** (if already pushed):
   ```bash
   git push origin --force --all
   ```

### Best Practice Summary

1. ✅ Use terminal environment variables for local development
2. ✅ Use `.env.example` as a template (no real secrets)
3. ✅ Use deployment platform environment variables for production
4. ❌ Don't keep real secrets in files that LLMs can access
5. ❌ Never commit `.env` files to git
