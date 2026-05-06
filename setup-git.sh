#!/bin/bash
set -e

cd "$(dirname "$0")"

echo "🔧 Cleaning up lock file if it exists..."
rm -f .git/index.lock

echo "🌿 Setting branch to main..."
git branch -m main 2>/dev/null || true

echo "📦 Staging all files..."
git add .

echo "💾 Creating initial commit..."
git commit -m "initial commit" --allow-empty

echo ""
echo "✅ Done! Git repo is ready."
echo ""
echo "Next steps:"
echo "  1. Go to github.com → New repository → name it 'bookme' → Create"
echo "  2. Run the two commands GitHub shows you (git remote add origin ... && git push)"
echo "  3. Go to vercel.com → Add New Project → import your bookme repo"
echo "  4. Add env vars: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  5. Deploy!"
