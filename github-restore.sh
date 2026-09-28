#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# ============================================================
# GitHub Restore Tool
#
# Restore a Branch to a rolling backup tag without rewriting
# Git history.
#
# Usage:
#
#   restore.sh <REPO> <BRANCH>
#
# Example:
#
#   ./restore.sh \
#       Degrees-of-Lewdity_Cheat_Extended \
#       Dev-1.20
#
# ============================================================


# ============================================================
# SETTINGS
# ============================================================

OWNER="chris81605"

# Number of backups displayed
SHOW_BACKUPS=5


# ============================================================
# HELP
# ============================================================

show_help() {
    cat <<'EOF'
GitHub Restore Tool

用法：

  restore.sh <REPO> <BRANCH>


============================================================
範例
============================================================

  ./restore.sh \
    Degrees-of-Lewdity_Cheat_Extended \
    Dev-1.20


============================================================
功能
============================================================

從 Repository 的：

  backup-*

Tag 中選擇一個版本，將指定 Branch 的檔案內容
還原至該 Backup。

流程：

  環境檢查
    ↓
  讀取 Backup Tags
    ↓
  選擇 Backup
    ↓
  Clone 目前 Branch
    ↓
  還原 Backup 完整檔案樹
    ↓
  顯示變更
    ↓
  最終確認
    ↓
  建立 Restore Commit
    ↓
  Push Branch
    ↓
  驗證遠端 Branch


============================================================
安全設計
============================================================

此工具不會：

  - git reset --hard 遠端歷史
  - Force Push Branch
  - 刪除既有 Git 歷史
  - 移動 Backup Tag

還原會建立新的 Commit：

  Restore from backup-YYYYMMDD-HHMMSS

因此：

  原本歷史
      ↓
  錯誤 Commit
      ↓
  Restore Commit

Git 歷史仍完整保留。


============================================================
Repository
============================================================

OWNER 固定由腳本 SETTINGS 設定。

執行時只需要提供：

  REPO
  BRANCH

實際 Repository：

  OWNER/REPO


============================================================
需求
============================================================

  git
  gh
  awk
  sort
  mktemp

EOF
}


# ============================================================
# ARGUMENT CHECK
# ============================================================

case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
esac


if (( $# != 2 )); then

    echo "❌ 用法："
    echo
    echo "  $0 <REPO> <BRANCH>"
    echo
    echo "例如："
    echo
    echo "  $0 Degrees-of-Lewdity_Cheat_Extended Dev-1.20"
    echo
    echo "執行："
    echo
    echo "  $0 --help"

    exit 1

fi


REPO_NAME="$1"
BRANCH="$2"


# ============================================================
# REPOSITORY
# ============================================================

REPO="$OWNER/$REPO_NAME"
GIT_REPO="git@github.com:$REPO.git"


# ============================================================
# TEMP WORKSPACE
# ============================================================

WORKDIR=""

cleanup() {

    if [[ -n "${WORKDIR:-}" && -d "$WORKDIR" ]]; then
        rm -rf -- "$WORKDIR"
    fi

}

trap cleanup EXIT INT TERM


# ============================================================
# PREFLIGHT
# ============================================================

echo
echo "========================================"
echo "              環境檢查"
echo "========================================"
echo


# ------------------------------------------------------------
# Required commands
# ------------------------------------------------------------

REQUIRED_COMMANDS=(
    git
    gh
    awk
    sort
    mktemp
)

MISSING_COMMANDS=()

for cmd in "${REQUIRED_COMMANDS[@]}"; do

    if command -v "$cmd" >/dev/null 2>&1; then

        printf "✓ %-10s %s\n" \
            "$cmd" \
            "$(command -v "$cmd")"

    else

        printf "✗ %-10s 找不到\n" "$cmd"

        MISSING_COMMANDS+=("$cmd")

    fi

done


if (( ${#MISSING_COMMANDS[@]} > 0 )); then

    echo
    echo "❌ 缺少必要指令："
    echo

    for cmd in "${MISSING_COMMANDS[@]}"; do
        echo "   - $cmd"
    done

    echo
    echo "Termux 可先嘗試："
    echo
    echo "   pkg install git gh coreutils gawk"

    exit 1

fi


# ------------------------------------------------------------
# Bash
# ------------------------------------------------------------

echo
echo "🔎 Shell..."

if [[ -z "${BASH_VERSION:-}" ]]; then

    echo "❌ 此腳本必須使用 Bash 執行。"
    exit 1

fi

echo "✓ Bash $BASH_VERSION"


# ------------------------------------------------------------
# GitHub CLI
# ------------------------------------------------------------

echo
echo "🔎 GitHub CLI..."

if ! gh auth status >/dev/null 2>&1; then

    echo "❌ GitHub CLI 尚未登入，或登入狀態無效。"
    echo
    echo "請檢查："
    echo
    echo "   gh auth status"

    exit 1

fi


GH_USER="$(
    gh api user \
        --jq '.login' \
        2>/dev/null || true
)"


if [[ -z "$GH_USER" ]]; then

    echo "❌ 無法取得目前 GitHub CLI 登入帳號。"
    exit 1

fi


echo "✓ GitHub CLI 已登入"
echo "✓ GitHub 帳號：$GH_USER"


# ------------------------------------------------------------
# Owner
# ------------------------------------------------------------

echo
echo "🔎 GitHub Owner..."

if [[ "$GH_USER" != "$OWNER" ]]; then

    echo "❌ GitHub CLI 登入帳號與腳本 OWNER 不一致。"
    echo
    echo "   gh 登入帳號 : $GH_USER"
    echo "   腳本 OWNER   : $OWNER"
    echo
    echo "為避免操作錯誤帳號，已停止執行。"

    exit 1

fi


echo "✓ OWNER 一致：$OWNER"


# ------------------------------------------------------------
# Repository API
# ------------------------------------------------------------

echo
echo "🔎 Repository..."

if ! gh repo view "$REPO" >/dev/null 2>&1; then

    echo "❌ GitHub API 無法存取 Repository："
    echo
    echo "   $REPO"
    echo
    echo "可能原因："
    echo
    echo "   - Repository 名稱錯誤"
    echo "   - Repository 不存在"
    echo "   - gh Token 沒有權限"

    exit 1

fi


echo "✓ GitHub API：$REPO"


# ------------------------------------------------------------
# Git SSH + refs
# ------------------------------------------------------------

echo
echo "🔎 Git SSH..."

REMOTE_REFS=""

if ! REMOTE_REFS="$(
    git ls-remote "$GIT_REPO" 2>/dev/null
)"; then

    echo "❌ 無法透過 Git SSH 存取 Repository："
    echo
    echo "   $GIT_REPO"
    echo
    echo "請檢查："
    echo
    echo "   - SSH Key"
    echo "   - GitHub SSH Key 設定"
    echo "   - ssh-agent / Key 權限"
    echo "   - 網路連線"

    exit 1

fi


echo "✓ Git SSH：$GIT_REPO"


# ------------------------------------------------------------
# Branch
# ------------------------------------------------------------

echo
echo "🔎 Branch..."

CURRENT_BRANCH_SHA="$(
    printf '%s\n' "$REMOTE_REFS" |
    awk -v ref="refs/heads/$BRANCH" '
        $2 == ref {
            print $1
            exit
        }
    '
)"


if [[ -z "$CURRENT_BRANCH_SHA" ]]; then

    echo "❌ Repository 可以正常存取，但找不到 Branch："
    echo
    echo "   $BRANCH"

    exit 1

fi


CURRENT_BRANCH_SHORT="${CURRENT_BRANCH_SHA:0:7}"

echo "✓ $BRANCH → $CURRENT_BRANCH_SHORT"


# ------------------------------------------------------------
# Git identity
# ------------------------------------------------------------

echo
echo "🔎 Git Commit 身分..."

GIT_USER_NAME="$(
    git config --global --get user.name 2>/dev/null || true
)"

GIT_USER_EMAIL="$(
    git config --global --get user.email 2>/dev/null || true
)"


if [[ -z "$GIT_USER_NAME" ]]; then

    echo "❌ 尚未設定 Git user.name。"
    echo
    echo '   git config --global user.name "Your Name"'

    exit 1

fi


if [[ -z "$GIT_USER_EMAIL" ]]; then

    echo "❌ 尚未設定 Git user.email。"
    echo
    echo '   git config --global user.email "your@email.com"'

    exit 1

fi


echo "✓ user.name  : $GIT_USER_NAME"
echo "✓ user.email : $GIT_USER_EMAIL"


# ------------------------------------------------------------
# Preflight result
# ------------------------------------------------------------

echo
echo "========================================"
echo "            ✓ 環境檢查完成"
echo "========================================"
echo

echo "GitHub     : $GH_USER"
echo "Repository : $REPO"
echo "SSH        : OK"
echo "Branch     : $BRANCH"
echo "HEAD       : $CURRENT_BRANCH_SHORT"
echo "Git Author : $GIT_USER_NAME <$GIT_USER_EMAIL>"
echo


# ============================================================
# GET BACKUP TAGS
# ============================================================

echo "🔍 讀取 Backup Tags..."

mapfile -t BACKUPS < <(
    printf '%s\n' "$REMOTE_REFS" |
    awk '
        $2 ~ /^refs\/tags\/backup-/ {
            sub("refs/tags/", "", $2)
            print $2
        }
    ' |
    sort -r |
    head -n "$SHOW_BACKUPS"
)


# ============================================================
# NO BACKUPS
# ============================================================

if (( ${#BACKUPS[@]} == 0 )); then

    echo
    echo "❌ 找不到 backup-* Tags。"

    exit 1

fi


# ============================================================
# SHOW BACKUPS
# ============================================================

echo
echo "========================================"
echo "              選擇 Backup"
echo "========================================"
echo


for i in "${!BACKUPS[@]}"; do

    printf "  [%d] %s\n" \
        "$((i + 1))" \
        "${BACKUPS[$i]}"

done


echo
echo "  [0] 取消"
echo


# ============================================================
# SELECT BACKUP
# ============================================================

read -r -p "請選擇： " CHOICE


if [[ "$CHOICE" == "0" ]]; then

    echo "已取消。"
    exit 0

fi


if ! [[ "$CHOICE" =~ ^[0-9]+$ ]]; then

    echo "❌ 無效選項。"
    exit 1

fi


INDEX=$((CHOICE - 1))


if (( INDEX < 0 ||
      INDEX >= ${#BACKUPS[@]} )); then

    echo "❌ 無效選項。"
    exit 1

fi


SELECTED="${BACKUPS[$INDEX]}"


# ============================================================
# GET BACKUP SHA
# ============================================================

BACKUP_SHA="$(
    printf '%s\n' "$REMOTE_REFS" |
    awk -v ref="refs/tags/$SELECTED" '
        $2 == ref {
            print $1
            exit
        }
    '
)"


if [[ -z "$BACKUP_SHA" ]]; then

    echo
    echo "❌ 無法取得 Backup SHA："
    echo
    echo "   $SELECTED"

    exit 1

fi


BACKUP_SHORT="${BACKUP_SHA:0:7}"


# ============================================================
# FIRST CONFIRMATION
# ============================================================

echo
echo "========================================"
echo "              還原確認"
echo "========================================"
echo

echo "Repository : $REPO"
echo "Branch     : $BRANCH"
echo "Current    : $CURRENT_BRANCH_SHORT"
echo "Backup     : $SELECTED"
echo "Backup SHA : $BACKUP_SHORT"
echo
echo "指定 Branch 的檔案內容將還原至此 Backup。"
echo
echo "Git 歷史不會被改寫。"
echo "還原會建立新的 Restore Commit。"
echo


read -r -p "確定繼續？ [y/N]: " CONFIRM


case "$CONFIRM" in

    y|Y|yes|YES|Yes)
        ;;

    *)
        echo
        echo "已取消。"
        exit 0
        ;;

esac


# ============================================================
# TEMP WORKSPACE
# ============================================================

WORKDIR="$(mktemp -d)"

REPO_DIR="$WORKDIR/repo"


# ============================================================
# CLONE CURRENT BRANCH
# ============================================================

echo
echo "📥 Clone $BRANCH..."

git clone \
    --quiet \
    --branch "$BRANCH" \
    --single-branch \
    "$GIT_REPO" \
    "$REPO_DIR"


cd "$REPO_DIR"

echo "✓ Clone 完成"


# ============================================================
# SAFETY CHECK
# ============================================================

if ! git rev-parse \
    --is-inside-work-tree \
    >/dev/null 2>&1
then

    echo
    echo "❌ Temporary Git Repository 不存在。"

    exit 1

fi


# ============================================================
# VERIFY CLONED HEAD
# ============================================================

CLONED_HEAD="$(
    git rev-parse HEAD
)"


if [[ "$CLONED_HEAD" != "$CURRENT_BRANCH_SHA" ]]; then

    echo
    echo "❌ Clone 後 Branch HEAD 與 Preflight 不一致。"
    echo
    echo "可能在操作期間有其他人更新了 Branch。"
    echo
    echo "Preflight : $CURRENT_BRANCH_SHA"
    echo "Clone     : $CLONED_HEAD"
    echo
    echo "為避免覆蓋新的變更，已停止還原。"

    exit 1

fi


# ============================================================
# FETCH BACKUP
# ============================================================

echo
echo "📥 Fetch Backup..."

git fetch \
    --quiet \
    origin \
    "refs/tags/$SELECTED:refs/tags/$SELECTED"


# ============================================================
# VERIFY BACKUP
# ============================================================

FETCHED_BACKUP_SHA="$(
    git rev-parse \
        "refs/tags/$SELECTED^{commit}"
)"


if [[ "$FETCHED_BACKUP_SHA" != "$BACKUP_SHA" ]]; then

    echo
    echo "❌ Backup Tag 在操作期間發生變化。"
    echo
    echo "原本：$BACKUP_SHA"
    echo "目前：$FETCHED_BACKUP_SHA"
    echo
    echo "為避免還原錯誤版本，已停止。"

    exit 1

fi


echo "✓ $SELECTED → $BACKUP_SHORT"


# ============================================================
# RESTORE COMPLETE TREE
# ============================================================

echo
echo "♻️ 還原 Repository..."

#
# Remove every currently tracked path from the index/worktree.
#

git rm \
    -rf \
    --quiet \
    --ignore-unmatch \
    .


#
# Restore complete tree from selected backup.
#

git checkout \
    "$SELECTED" \
    -- .


#
# Stage complete result.
#

git add -A


# ============================================================
# SHOW CHANGES
# ============================================================

echo
echo "========================================"
echo "              還原變更"
echo "========================================"
echo

git status --short

echo


# ============================================================
# ALREADY IDENTICAL
# ============================================================

if git diff --cached --quiet; then

    echo "ℹ️ 目前 Branch 的檔案內容已經與 Backup 相同。"
    echo
    echo "Backup：$SELECTED"
    echo
    echo "不需要建立 Restore Commit。"

    exit 0

fi


# ============================================================
# FINAL CONFIRMATION
# ============================================================

echo "⚠️ 上述變更將建立新的 Restore Commit 並 Push。"
echo
echo "Repository : $REPO"
echo "Branch     : $BRANCH"
echo "Restore    : $SELECTED"
echo


read -r -p "確認還原？ [y/N]: " FINAL_CONFIRM


case "$FINAL_CONFIRM" in

    y|Y|yes|YES|Yes)
        ;;

    *)
        echo
        echo "已取消。"
        exit 0
        ;;

esac


# ============================================================
# REMOTE RACE CHECK
#
# Make sure Branch has not changed after clone but before push.
# ============================================================

echo
echo "🔎 最終確認遠端 Branch..."

LATEST_REMOTE_SHA="$(
    git ls-remote \
        "$GIT_REPO" \
        "refs/heads/$BRANCH" |
    awk 'NR == 1 {print $1}'
)"


if [[ "$LATEST_REMOTE_SHA" != "$CURRENT_BRANCH_SHA" ]]; then

    echo
    echo "❌ Branch 在還原操作期間已被更新。"
    echo
    echo "原本：$CURRENT_BRANCH_SHA"
    echo "目前：${LATEST_REMOTE_SHA:-不存在}"
    echo
    echo "為避免覆蓋新的 Commit，已停止還原。"

    exit 1

fi


echo "✓ Branch 未發生其他變更"


# ============================================================
# COMMIT
# ============================================================

echo
echo "📝 建立 Restore Commit..."

git commit \
    --quiet \
    -m "Restore from $SELECTED"


RESTORE_SHA="$(
    git rev-parse HEAD
)"

RESTORE_SHORT="${RESTORE_SHA:0:7}"


echo "✓ $RESTORE_SHORT"


# ============================================================
# PUSH
# ============================================================

echo
echo "⬆️ Push → $BRANCH..."

git push \
    --quiet \
    origin \
    "HEAD:refs/heads/$BRANCH"


echo "✓ Push 完成"


# ============================================================
# VERIFY REMOTE
# ============================================================

echo
echo "🔎 驗證 Branch..."

FINAL_REMOTE_SHA="$(
    git ls-remote \
        "$GIT_REPO" \
        "refs/heads/$BRANCH" |
    awk 'NR == 1 {print $1}'
)"


if [[ "$FINAL_REMOTE_SHA" != "$RESTORE_SHA" ]]; then

    echo
    echo "❌ 還原後 Branch 驗證失敗。"
    echo
    echo "預期：$RESTORE_SHA"
    echo "實際：${FINAL_REMOTE_SHA:-不存在}"

    exit 1

fi


echo "✓ $BRANCH → $RESTORE_SHORT"


# ============================================================
# DONE
# ============================================================

echo
echo "========================================"
echo "              ✅ 還原完成"
echo "========================================"
echo

echo "Repository : $REPO"
echo "Branch     : $BRANCH"
echo "Before     : $CURRENT_BRANCH_SHORT"
echo "Backup     : $SELECTED"
echo "Backup SHA : $BACKUP_SHORT"
echo "Restore    : $RESTORE_SHORT"
echo "History    : 保留"
echo