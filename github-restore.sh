#!/data/data/com.termux/files/usr/bin/bash
set -e

# ============================================================
# PROJECT SETTINGS
# ============================================================

REPO="git@github.com:chris81605/Degrees-of-Lewdity_Cheat_Extended.git"
BRANCH="Dev-1.20"

# Number of backups displayed
SHOW_BACKUPS=5

# ============================================================


# ------------------------------------------------------------
# Basic checks
# ------------------------------------------------------------

for cmd in git awk sort; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "❌ Missing command: $cmd"
        echo "Run: pkg install git coreutils gawk"
        exit 1
    fi
done


# ------------------------------------------------------------
# Temporary workspace
# ------------------------------------------------------------

WORKDIR="$(mktemp -d)"

cleanup() {
    rm -rf -- "$WORKDIR"
}

trap cleanup EXIT INT TERM


# ------------------------------------------------------------
# Header
# ------------------------------------------------------------

echo "========================================"
echo " GitHub Restore"
echo "========================================"
echo "Repo   : $REPO"
echo "Branch : $BRANCH"
echo "========================================"


# ------------------------------------------------------------
# Get backup tags
# ------------------------------------------------------------

echo
echo "🔍 Loading backups..."

mapfile -t BACKUPS < <(
    git ls-remote \
        --tags \
        --refs \
        "$REPO" \
        'refs/tags/backup-*' |
    awk '{
        sub("refs/tags/", "", $2)
        print $2
    }' |
    sort -r |
    head -n "$SHOW_BACKUPS"
)


# ------------------------------------------------------------
# No backups
# ------------------------------------------------------------

if (( ${#BACKUPS[@]} == 0 )); then
    echo "❌ No backup tags found."
    exit 1
fi


# ------------------------------------------------------------
# Show backups
# ------------------------------------------------------------

echo
echo "💾 Available backups:"
echo "----------------------------------------"

for i in "${!BACKUPS[@]}"; do
    printf " [%d] %s\n" "$((i + 1))" "${BACKUPS[$i]}"
done

echo "----------------------------------------"
echo " [0] Cancel"
echo


# ------------------------------------------------------------
# Select backup
# ------------------------------------------------------------

read -r -p "Select backup: " CHOICE

if [[ "$CHOICE" == "0" ]]; then
    echo "🛑 Cancelled."
    exit 0
fi

if ! [[ "$CHOICE" =~ ^[0-9]+$ ]]; then
    echo "❌ Invalid selection."
    exit 1
fi

INDEX=$((CHOICE - 1))

if (( INDEX < 0 || INDEX >= ${#BACKUPS[@]} )); then
    echo "❌ Invalid selection."
    exit 1
fi

SELECTED="${BACKUPS[$INDEX]}"


# ------------------------------------------------------------
# Confirmation
# ------------------------------------------------------------

echo
echo "⚠️ RESTORE CONFIRMATION"
echo "========================================"
echo "Branch : $BRANCH"
echo "Backup : $SELECTED"
echo
echo "The repository contents will be restored"
echo "to this backup version."
echo
echo "Git history will NOT be rewritten."
echo "A new restore commit will be created."
echo "========================================"
echo

read -r -p "Continue? [y/N]: " CONFIRM

case "$CONFIRM" in
    y|Y|yes|YES|Yes)
        ;;
    *)
        echo "🛑 Restore cancelled."
        exit 0
        ;;
esac


# ------------------------------------------------------------
# Clone current branch
# ------------------------------------------------------------

echo
echo "⬇️ Cloning current branch..."

git clone \
    --branch "$BRANCH" \
    --single-branch \
    "$REPO" \
    "$WORKDIR/repo"

cd "$WORKDIR/repo"


# ------------------------------------------------------------
# Safety check
# ------------------------------------------------------------

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    echo "❌ Temporary Git repository is missing."
    exit 1
fi


# ------------------------------------------------------------
# Fetch backup tag
# ------------------------------------------------------------

echo
echo "⬇️ Fetching backup..."

git fetch origin \
    "refs/tags/$SELECTED:refs/tags/$SELECTED"


# ------------------------------------------------------------
# Verify backup
# ------------------------------------------------------------

if ! git rev-parse \
    --verify \
    "refs/tags/$SELECTED^{commit}" \
    >/dev/null 2>&1; then

    echo "❌ Backup tag could not be verified."
    exit 1
fi


# ------------------------------------------------------------
# Restore complete tree
# ------------------------------------------------------------

echo
echo "♻️ Restoring repository..."

# Remove all currently tracked files.
git rm -rf --quiet .

# Restore all files from selected backup.
git checkout "$SELECTED" -- .

# Stage everything.
git add -A


# ------------------------------------------------------------
# Show changes
# ------------------------------------------------------------

echo
echo "📋 Restore changes:"
echo "----------------------------------------"

git status --short

echo "----------------------------------------"


# ------------------------------------------------------------
# Already identical
# ------------------------------------------------------------

if git diff --cached --quiet; then
    echo
    echo "ℹ Current branch already matches:"
    echo "   $SELECTED"
    echo
    echo "Nothing needs to be restored."
    exit 0
fi


# ------------------------------------------------------------
# Final confirmation
# ------------------------------------------------------------

echo
echo "⚠️ The changes shown above will now be pushed."
echo

read -r -p "Confirm restore? [y/N]: " FINAL_CONFIRM

case "$FINAL_CONFIRM" in
    y|Y|yes|YES|Yes)
        ;;
    *)
        echo
        echo "🛑 Restore cancelled."
        exit 0
        ;;
esac


# ------------------------------------------------------------
# Commit
# ------------------------------------------------------------

echo
echo "📝 Creating restore commit..."

git commit \
    -m "Restore from $SELECTED"


# ------------------------------------------------------------
# Push
# ------------------------------------------------------------

echo
echo "⬆️ Pushing restored version..."

git push origin "$BRANCH"


# ------------------------------------------------------------
# Done
# ------------------------------------------------------------

echo
echo "========================================"
echo "✅ Restore complete."
echo
echo "Branch   : $BRANCH"
echo "Restored : $SELECTED"
echo "History  : preserved"
echo "========================================"