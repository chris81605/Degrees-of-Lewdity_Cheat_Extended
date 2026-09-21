#!/data/data/com.termux/files/usr/bin/bash
set -euo pipefail

# ============================================================
# GitHub Mod Publish Tool
#
# ZIP -> Branch Push -> Optional GitHub Release
#
# Usage:
#   ./publish.sh <REPO> <BRANCH> [TAG|-] [COMMENT]
#
# Examples:
#   ./publish.sh Degrees-of-Lewdity_Cheat_Extended Dev-1.20
#   ./publish.sh Degrees-of-Lewdity_Cheat_Extended Dev-1.20 - "Fix xxx"
#   ./publish.sh Degrees-of-Lewdity_Cheat_Extended Dev-1.20 Pre-release
#   ./publish.sh Degrees-of-Lewdity_Cheat_Extended Dev-1.20 Pre-release "Update test build"
#   ./publish.sh Degrees-of-Lewdity_Cheat_Extended main V1.20 "Release V1.20"
# ============================================================


# ============================================================
# SETTINGS
# ============================================================

OWNER="chris81605"

# Number of rolling backup tags to keep
KEEP_BACKUPS=5

# Files that must never be committed to the repository
EXCLUDE_PATTERNS=(
    "*.zip"
    "*.bk"
    "*.bak"
)


# ============================================================
# HELP
# ============================================================

show_help() {
    cat <<'EOF'
GitHub Mod Publish Tool

用法：
  publish.sh <REPO> <BRANCH> [TAG|-] [COMMENT]
  publish.sh -h
  publish.sh --help

參數：
  REPO       GitHub Repository 名稱
  BRANCH     ZIP 內容要同步到的目標分支
  TAG        Release Tag
             省略或使用 "-" 時，只 Push、不發布 Release
  COMMENT    Git Commit 訊息，可省略

操作模式：

  Push only
    未指定 TAG，或 TAG 為 "-"
    ZIP 解壓後的內容會完整同步至指定 Branch。

  Push + Release
    指定 TAG
    ZIP 解壓內容 Push 後：
      1. Tag 指向 Push 後的 Branch HEAD
      2. 建立或更新 GitHub Release
      3. 原始 ZIP 作為 Release 附件上傳

範例：

  # 只 Push，自動 Commit 訊息
  publish.sh Degrees-of-Lewdity_Cheat_Extended Dev-1.20

  # 只 Push，自訂 Commit 訊息
  publish.sh Degrees-of-Lewdity_Cheat_Extended Dev-1.20 - "Fix xxx"

  # Push + Pre-release
  publish.sh Degrees-of-Lewdity_Cheat_Extended Dev-1.20 Pre-release

  # Push + Release + 自訂 Commit 訊息
  publish.sh Degrees-of-Lewdity_Cheat_Extended Dev-1.20 Pre-release "Update test build"

  # 正式版本
  publish.sh Degrees-of-Lewdity_Cheat_Extended main V1.20 "Release V1.20"

Release Notes：

  新 Release：
    [1] 手動輸入
    [2] 從 Markdown / TXT 讀取
    [3] 無發布說明

  既有 Release：
    [1] 手動輸入
    [2] 從 Markdown / TXT 讀取
    [3] 保留目前發布說明
    [4] 清空發布說明

Backup：

  每次實際 Push 新 Commit 前，會建立：

    backup-YYYYMMDD-HHMMSS

  Backup Tag 指向 Push 前的 Branch HEAD。
  自動只保留最近 5 個 backup-* Tags。

ZIP：

  腳本會列出 publish.sh 所在目錄的 *.zip。
  所選 ZIP 的解壓內容會完整同步到目標 Branch。

  ZIP 本身不會 Commit 到 Repository，
  而是在發布模式下作為 GitHub Release Asset 上傳。

需求：

  git
  gh
  unzip
  rsync

GitHub CLI 必須已登入：

  gh auth status
EOF
}


# ============================================================
# HELP / ARGUMENT CHECK
# ============================================================

case "${1:-}" in
    -h|--help)
        show_help
        exit 0
        ;;
esac

if (( $# < 2 )); then
    echo "❌ 缺少必要參數。"
    echo
    echo "用法："
    echo "  $0 <REPO> <BRANCH> [TAG|-] [COMMENT]"
    echo
    echo "執行："
    echo "  $0 --help"
    echo
    echo "查看完整說明。"
    exit 1
fi

if (( $# > 4 )); then
    echo "❌ 參數過多。"
    echo
    echo "用法："
    echo "  $0 <REPO> <BRANCH> [TAG|-] [COMMENT]"
    exit 1
fi


# ============================================================
# ARGUMENTS
# ============================================================

REPO_NAME="$1"
BRANCH="$2"
TAG="${3:-}"
COMMENT="${4:-}"

REPO="$OWNER/$REPO_NAME"
GIT_REPO="git@github.com:$REPO.git"

RELEASE_MODE=false

if [[ -n "$TAG" && "$TAG" != "-" ]]; then
    RELEASE_MODE=true
fi


# ============================================================
# DEFAULT COMMIT MESSAGE
# ============================================================

if [[ -z "$COMMENT" ]]; then

    if $RELEASE_MODE; then
        COMMENT="Publish $TAG"
    else
        COMMENT="Update $BRANCH"
    fi

fi


# ============================================================
# REQUIREMENTS
# ============================================================

for cmd in git gh unzip rsync find sort awk du mktemp date; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "❌ 缺少指令：$cmd"
        echo
        echo "Termux 可嘗試："
        echo "  pkg install git gh unzip rsync"
        exit 1
    fi
done


# ============================================================
# GH AUTH
# ============================================================

if ! gh auth status >/dev/null 2>&1; then
    echo "❌ GitHub CLI 尚未登入。"
    echo
    echo "請先確認："
    echo "  gh auth status"
    exit 1
fi


# ============================================================
# PATHS
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT_NAME="$(basename "$0")"

TMP_ROOT=""

cleanup() {
    if [[ -n "${TMP_ROOT:-}" && -d "$TMP_ROOT" ]]; then
        rm -rf "$TMP_ROOT"
    fi
}

trap cleanup EXIT INT TERM


# ============================================================
# VERIFY REPOSITORY
# ============================================================

echo
echo "🔎 檢查 Repository..."

if ! gh repo view "$REPO" >/dev/null 2>&1; then
    echo
    echo "❌ 找不到 Repository，或目前帳號沒有存取權限："
    echo "   $REPO"
    exit 1
fi

echo "✓ $REPO"


# ============================================================
# GET CURRENT BRANCH HEAD
# ============================================================

echo
echo "🔎 取得遠端 Branch..."

OLD_BRANCH_SHA="$(
    git ls-remote \
        "$GIT_REPO" \
        "refs/heads/$BRANCH" |
    awk 'NR == 1 {print $1}'
)"

if [[ -z "$OLD_BRANCH_SHA" ]]; then
    echo
    echo "❌ 找不到遠端 Branch：$BRANCH"
    echo
    echo "目前版本要求 Branch 必須已經存在。"
    exit 1
fi

OLD_BRANCH_SHORT="${OLD_BRANCH_SHA:0:7}"

echo "✓ $BRANCH → $OLD_BRANCH_SHORT"


# ============================================================
# SELECT ZIP
# ============================================================

mapfile -t ZIP_FILES < <(
    find "$SCRIPT_DIR" \
        -maxdepth 1 \
        -type f \
        -iname '*.zip' \
        -printf '%f\n' |
    sort
)

if (( ${#ZIP_FILES[@]} == 0 )); then
    echo
    echo "❌ 腳本所在目錄找不到 ZIP 檔案。"
    exit 1
fi

echo
echo "========================================"
echo "              選擇 ZIP"
echo "========================================"
echo

for i in "${!ZIP_FILES[@]}"; do
    printf "  [%d] %s\n" \
        "$((i + 1))" \
        "${ZIP_FILES[$i]}"
done

echo
echo "  [0] 取消"
echo

read -r -p "請選擇： " ZIP_CHOICE

if [[ "$ZIP_CHOICE" == "0" ]]; then
    echo "已取消。"
    exit 0
fi

if ! [[ "$ZIP_CHOICE" =~ ^[0-9]+$ ]]; then
    echo "❌ 無效選項。"
    exit 1
fi

if (( ZIP_CHOICE < 1 || ZIP_CHOICE > ${#ZIP_FILES[@]} )); then
    echo "❌ 無效選項。"
    exit 1
fi

ZIP_NAME="${ZIP_FILES[$((ZIP_CHOICE - 1))]}"
ZIP_PATH="$SCRIPT_DIR/$ZIP_NAME"

ZIP_SIZE="$(
    du -h "$ZIP_PATH" |
    awk '{print $1}'
)"


# ============================================================
# CHECK ZIP
# ============================================================

echo
echo "🔎 測試 ZIP..."

if ! unzip -tq "$ZIP_PATH" >/dev/null; then
    echo
    echo "❌ ZIP 測試失敗："
    echo "   $ZIP_NAME"
    exit 1
fi

echo "✓ ZIP 正常"


# ============================================================
# CHECK TAG / RELEASE
# ============================================================

TAG_EXISTS=false
OLD_TAG_SHA=""
RELEASE_EXISTS=false

if $RELEASE_MODE; then

    OLD_TAG_SHA="$(
        git ls-remote \
            "$GIT_REPO" \
            "refs/tags/$TAG" |
        awk 'NR == 1 {print $1}'
    )"

    if [[ -n "$OLD_TAG_SHA" ]]; then
        TAG_EXISTS=true
    fi

    if gh release view \
        "$TAG" \
        --repo "$REPO" \
        >/dev/null 2>&1
    then
        RELEASE_EXISTS=true
    fi

fi


# ============================================================
# RELEASE NOTES
# ============================================================

NOTES_MODE=""
NOTES=""
NOTES_FILE=""
NOTES_DESCRIPTION=""

if $RELEASE_MODE; then

    echo
    echo "========================================"
    echo "              發布說明"
    echo "========================================"
    echo

    if $RELEASE_EXISTS; then

        echo "Release \"$TAG\" 已存在。"
        echo
        echo "  [1] 手動輸入"
        echo "  [2] 從 Markdown / TXT 讀取"
        echo "  [3] 保留目前發布說明"
        echo "  [4] 清空發布說明"
        echo "  [0] 取消"

    else

        echo "這是新的 Release。"
        echo
        echo "  [1] 手動輸入"
        echo "  [2] 從 Markdown / TXT 讀取"
        echo "  [3] 無發布說明"
        echo "  [0] 取消"

    fi

    echo
    read -r -p "請選擇： " NOTES_CHOICE

    if [[ "$NOTES_CHOICE" == "0" ]]; then
        echo "已取消。"
        exit 0
    fi


    # --------------------------------------------------------
    # Manual notes
    # --------------------------------------------------------

    if [[ "$NOTES_CHOICE" == "1" ]]; then

        NOTES_MODE="manual"
        NOTES_DESCRIPTION="手動輸入"

        echo
        echo "----------------------------------------"
        echo "請輸入發布說明"
        echo
        echo "支援 Markdown 與多行文字。"
        echo "單獨輸入 .done 完成。"
        echo "----------------------------------------"
        echo

        NOTES=""

        while IFS= read -r LINE; do

            if [[ "$LINE" == ".done" ]]; then
                break
            fi

            if [[ -z "$NOTES" ]]; then
                NOTES="$LINE"
            else
                NOTES+=$'\n'"$LINE"
            fi

        done


    # --------------------------------------------------------
    # Notes from file
    # --------------------------------------------------------

    elif [[ "$NOTES_CHOICE" == "2" ]]; then

        mapfile -t NOTE_FILES < <(
            find "$SCRIPT_DIR" \
                -maxdepth 1 \
                -type f \
                \( -iname '*.md' -o -iname '*.txt' \) \
                -printf '%f\n' |
            sort
        )

        if (( ${#NOTE_FILES[@]} == 0 )); then
            echo
            echo "❌ 找不到 .md 或 .txt 檔案。"
            exit 1
        fi

        echo
        echo "選擇發布說明檔案："
        echo

        for i in "${!NOTE_FILES[@]}"; do
            printf "  [%d] %s\n" \
                "$((i + 1))" \
                "${NOTE_FILES[$i]}"
        done

        echo
        echo "  [0] 取消"
        echo

        read -r -p "請選擇： " NOTE_FILE_CHOICE

        if [[ "$NOTE_FILE_CHOICE" == "0" ]]; then
            echo "已取消。"
            exit 0
        fi

        if ! [[ "$NOTE_FILE_CHOICE" =~ ^[0-9]+$ ]]; then
            echo "❌ 無效選項。"
            exit 1
        fi

        if (( NOTE_FILE_CHOICE < 1 ||
              NOTE_FILE_CHOICE > ${#NOTE_FILES[@]} )); then
            echo "❌ 無效選項。"
            exit 1
        fi

        NOTE_FILE_NAME="${NOTE_FILES[$((NOTE_FILE_CHOICE - 1))]}"

        NOTES_FILE="$SCRIPT_DIR/$NOTE_FILE_NAME"
        NOTES_MODE="file"
        NOTES_DESCRIPTION="檔案：$NOTE_FILE_NAME"


    # --------------------------------------------------------
    # Keep existing notes
    # --------------------------------------------------------

    elif $RELEASE_EXISTS && [[ "$NOTES_CHOICE" == "3" ]]; then

        NOTES_MODE="keep"
        NOTES_DESCRIPTION="保留目前發布說明"


    # --------------------------------------------------------
    # Clear existing notes
    # --------------------------------------------------------

    elif $RELEASE_EXISTS && [[ "$NOTES_CHOICE" == "4" ]]; then

        NOTES_MODE="clear"
        NOTES_DESCRIPTION="清空發布說明"


    # --------------------------------------------------------
    # New release without notes
    # --------------------------------------------------------

    elif ! $RELEASE_EXISTS && [[ "$NOTES_CHOICE" == "3" ]]; then

        NOTES_MODE="empty"
        NOTES_DESCRIPTION="無發布說明"


    else

        echo "❌ 無效選項。"
        exit 1

    fi

fi


# ============================================================
# FIRST CONFIRMATION
# ============================================================

echo
echo "========================================"
echo "              操作確認"
echo "========================================"
echo
echo "Repository : $REPO"
echo "Branch     : $BRANCH"
echo "目前 Commit: $OLD_BRANCH_SHORT"
echo
echo "ZIP        : $ZIP_NAME"
echo "Size       : $ZIP_SIZE"
echo "Commit     : $COMMENT"

if $RELEASE_MODE; then
    echo "Mode       : Push + Release"
    echo "Tag        : $TAG"

    if $TAG_EXISTS; then
        echo "Tag 狀態   : 已存在 (${OLD_TAG_SHA:0:7})"
    else
        echo "Tag 狀態   : 不存在，將建立"
    fi

    if $RELEASE_EXISTS; then
        echo "Release    : 已存在，將更新"
    else
        echo "Release    : 不存在，將建立"
    fi

    echo "發布說明   : $NOTES_DESCRIPTION"
else
    echo "Mode       : Push only"
    echo "Tag        : -"
fi


# ------------------------------------------------------------
# Notes preview
# ------------------------------------------------------------

if $RELEASE_MODE; then

    if [[ "$NOTES_MODE" == "manual" ]]; then

        echo
        echo "----------------------------------------"
        echo "發布說明預覽"
        echo "----------------------------------------"
        printf '%s\n' "$NOTES"
        echo "----------------------------------------"

    elif [[ "$NOTES_MODE" == "file" ]]; then

        echo
        echo "----------------------------------------"
        echo "發布說明預覽"
        echo "----------------------------------------"
        cat "$NOTES_FILE"
        echo
        echo "----------------------------------------"

    fi

fi

echo
echo "此操作會使用 ZIP 解壓後的內容完整同步目標 Branch。"

if $RELEASE_MODE; then
    echo "Push 完成後，Tag / Release 會更新至新的 Branch HEAD。"
fi

echo
read -r -p "確定繼續？ [y/N]: " CONFIRM

case "$CONFIRM" in
    y|Y)
        ;;
    *)
        echo
        echo "已取消。"
        exit 0
        ;;
esac


# ============================================================
# CREATE TEMP WORKSPACE
# ============================================================

TMP_ROOT="$(mktemp -d)"
SOURCE_DIR="$TMP_ROOT/source"
WORK_DIR="$TMP_ROOT/repo"

mkdir -p "$SOURCE_DIR"


# ============================================================
# EXTRACT ZIP
# ============================================================

echo
echo "📦 解壓 ZIP..."

unzip -q "$ZIP_PATH" -d "$SOURCE_DIR"

echo "✓ 解壓完成"


# ============================================================
# CLONE TARGET BRANCH
# ============================================================

echo
echo "📥 取得 Repository..."

git clone \
    --quiet \
    --single-branch \
    --branch "$BRANCH" \
    "$GIT_REPO" \
    "$WORK_DIR"

echo "✓ Repository 準備完成"


# ============================================================
# BUILD RSYNC EXCLUDES
# ============================================================

RSYNC_EXCLUDES=(
    --exclude='.git/'
)

for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    RSYNC_EXCLUDES+=(--exclude="$pattern")
done


# ============================================================
# SYNC ZIP -> REPOSITORY
# ============================================================

echo
echo "🔄 同步 ZIP 內容..."

rsync \
    -a \
    --delete \
    "${RSYNC_EXCLUDES[@]}" \
    "$SOURCE_DIR/" \
    "$WORK_DIR/"

cd "$WORK_DIR"


# ============================================================
# REMOVE EXCLUDED FILES ALREADY TRACKED / PRESENT
# ============================================================

for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    find . \
        -path './.git' -prune -o \
        -type f \
        -name "$pattern" \
        -delete
done


# ============================================================
# CHECK CHANGES
# ============================================================

git add -A

HAS_CHANGES=true

if git diff --cached --quiet; then
    HAS_CHANGES=false
fi


# ============================================================
# BACKUP + COMMIT + PUSH
# ============================================================

if $HAS_CHANGES; then

    # --------------------------------------------------------
    # Backup current remote HEAD
    # --------------------------------------------------------

    BACKUP_TAG="backup-$(date '+%Y%m%d-%H%M%S')"

    echo
    echo "💾 建立 Backup Tag：$BACKUP_TAG"
    echo "   → $OLD_BRANCH_SHORT"

    gh api \
        --method POST \
        "repos/$REPO/git/refs" \
        -f ref="refs/tags/$BACKUP_TAG" \
        -f sha="$OLD_BRANCH_SHA" \
        --silent


    # --------------------------------------------------------
    # Commit
    # --------------------------------------------------------

    echo
    echo "📝 建立 Commit..."

    git commit \
        --quiet \
        -m "$COMMENT"

    NEW_SHA="$(git rev-parse HEAD)"
    NEW_SHORT="${NEW_SHA:0:7}"

    echo "✓ $NEW_SHORT"


    # --------------------------------------------------------
    # Push
    # --------------------------------------------------------

    echo
    echo "⬆️ Push → $BRANCH..."

    git push \
        --quiet \
        origin \
        "HEAD:refs/heads/$BRANCH"

    echo "✓ Push 完成"

else

    echo
    echo "ℹ️ ZIP 內容與目前 Branch 完全相同。"
    echo "   不建立新的 Commit。"
    echo "   不建立 Backup Tag。"

    NEW_SHA="$OLD_BRANCH_SHA"
    NEW_SHORT="$OLD_BRANCH_SHORT"

fi


# ============================================================
# VERIFY BRANCH
# ============================================================

echo
echo "🔎 驗證 Branch..."

REMOTE_SHA="$(
    git ls-remote \
        "$GIT_REPO" \
        "refs/heads/$BRANCH" |
    awk 'NR == 1 {print $1}'
)"

if [[ "$REMOTE_SHA" != "$NEW_SHA" ]]; then
    echo
    echo "❌ Branch 驗證失敗。"
    echo
    echo "預期：$NEW_SHA"
    echo "實際：${REMOTE_SHA:-不存在}"
    exit 1
fi

echo "✓ $BRANCH → $NEW_SHORT"


# ============================================================
# CLEAN OLD BACKUP TAGS
# ============================================================

if $HAS_CHANGES; then

    echo
    echo "🧹 清理舊 Backup Tags..."

    mapfile -t BACKUP_TAGS < <(
        git ls-remote \
            --refs \
            --tags \
            "$GIT_REPO" \
            'refs/tags/backup-*' |
        awk '{sub("refs/tags/", "", $2); print $2}' |
        sort -r
    )

    if (( ${#BACKUP_TAGS[@]} > KEEP_BACKUPS )); then

        for ((i = KEEP_BACKUPS; i < ${#BACKUP_TAGS[@]}; i++)); do

            OLD_BACKUP="${BACKUP_TAGS[$i]}"

            echo "  刪除：$OLD_BACKUP"

            gh api \
                --method DELETE \
                "repos/$REPO/git/refs/tags/$OLD_BACKUP" \
                --silent

        done

    fi

    echo "✓ Backup Tags 保留最近 $KEEP_BACKUPS 個"

fi


# ============================================================
# PUSH ONLY -> DONE
# ============================================================

if ! $RELEASE_MODE; then

    echo
    echo "========================================"
    echo "              ✅ Push 完成"
    echo "========================================"
    echo
    echo "Repository : $REPO"
    echo "Branch     : $BRANCH"
    echo "Commit     : $NEW_SHORT"
    echo "ZIP        : $ZIP_NAME"

    if $HAS_CHANGES; then
        echo "Backup     : $BACKUP_TAG"
    else
        echo "Changes    : 無變更"
    fi

    echo
    exit 0

fi


# ============================================================
# CREATE / MOVE RELEASE TAG
# ============================================================

echo

if $TAG_EXISTS; then

    if [[ "$OLD_TAG_SHA" == "$NEW_SHA" ]]; then

        echo "🏷️ Tag 已指向目前 Commit：$TAG → $NEW_SHORT"

    else

        echo "🏷️ 更新 Tag：$TAG"
        echo "   ${OLD_TAG_SHA:0:7} → $NEW_SHORT"

        gh api \
            --method PATCH \
            "repos/$REPO/git/refs/tags/$TAG" \
            -f sha="$NEW_SHA" \
            -F force=true \
            --silent

    fi

else

    echo "🏷️ 建立 Tag：$TAG → $NEW_SHORT"

    gh api \
        --method POST \
        "repos/$REPO/git/refs" \
        -f ref="refs/tags/$TAG" \
        -f sha="$NEW_SHA" \
        --silent

fi


# ============================================================
# UPDATE EXISTING RELEASE
# ============================================================

if $RELEASE_EXISTS; then

    echo
    echo "📦 更新 Release：$TAG"


    # --------------------------------------------------------
    # Release notes
    # --------------------------------------------------------

    case "$NOTES_MODE" in

        manual)

            echo "📝 更新發布說明"

            printf '%s\n' "$NOTES" |
                gh release edit \
                    "$TAG" \
                    --repo "$REPO" \
                    --notes-file -

            ;;

        file)

            echo "📝 更新發布說明"

            gh release edit \
                "$TAG" \
                --repo "$REPO" \
                --notes-file "$NOTES_FILE"

            ;;

        clear)

            echo "📝 清空發布說明"

            gh release edit \
                "$TAG" \
                --repo "$REPO" \
                --notes ""

            ;;

        keep)

            echo "📝 保留目前發布說明"

            ;;

    esac


    # --------------------------------------------------------
    # Upload asset
    # --------------------------------------------------------

    echo
    echo "⬆️ 上傳 Release Asset：$ZIP_NAME"

    gh release upload \
        "$TAG" \
        "$ZIP_PATH" \
        --repo "$REPO" \
        --clobber


# ============================================================
# CREATE NEW RELEASE
# ============================================================

else

    echo
    echo "📦 建立 Release：$TAG"

    RELEASE_ARGS=(
        "$TAG"
        "$ZIP_PATH"
        --repo "$REPO"
        --title "$TAG"
        --verify-tag
    )


    # --------------------------------------------------------
    # Automatic prerelease detection
    # --------------------------------------------------------

    TAG_LOWER="${TAG,,}"

    if [[ "$TAG_LOWER" == *"pre-release"* ]] ||
       [[ "$TAG_LOWER" == *"prerelease"* ]]; then

        RELEASE_ARGS+=(--prerelease)
        RELEASE_ARGS+=(--latest=false)

    fi


    # --------------------------------------------------------
    # Create
    # --------------------------------------------------------

    case "$NOTES_MODE" in

        manual)

            printf '%s\n' "$NOTES" |
                gh release create \
                    "${RELEASE_ARGS[@]}" \
                    --notes-file -

            ;;

        file)

            gh release create \
                "${RELEASE_ARGS[@]}" \
                --notes-file "$NOTES_FILE"

            ;;

        empty)

            gh release create \
                "${RELEASE_ARGS[@]}" \
                --notes ""

            ;;

    esac

fi


# ============================================================
# VERIFY TAG
# ============================================================

echo
echo "🔎 驗證 Tag..."

FINAL_TAG_SHA="$(
    git ls-remote \
        "$GIT_REPO" \
        "refs/tags/$TAG" |
    awk 'NR == 1 {print $1}'
)"

if [[ "$FINAL_TAG_SHA" != "$NEW_SHA" ]]; then

    echo
    echo "❌ Tag 驗證失敗。"
    echo
    echo "預期：$NEW_SHA"
    echo "實際：${FINAL_TAG_SHA:-不存在}"
    exit 1

fi

echo "✓ $TAG → $NEW_SHORT"


# ============================================================
# VERIFY RELEASE
# ============================================================

echo "🔎 驗證 Release..."

if ! gh release view \
    "$TAG" \
    --repo "$REPO" \
    >/dev/null 2>&1
then

    echo
    echo "❌ Release 驗證失敗。"
    exit 1

fi

echo "✓ Release 存在"


# ============================================================
# RESULT
# ============================================================

RELEASE_URL="$(
    gh release view \
        "$TAG" \
        --repo "$REPO" \
        --json url \
        --jq '.url'
)"


# ============================================================
# DONE
# ============================================================

echo
echo "========================================"
echo "             ✅ 發布完成"
echo "========================================"
echo
echo "Repository : $REPO"
echo "Branch     : $BRANCH"
echo "Commit     : $NEW_SHORT"
echo "Tag        : $TAG"
echo "ZIP        : $ZIP_NAME"

if $HAS_CHANGES; then
    echo "Backup     : $BACKUP_TAG"
else
    echo "Changes    : 無變更"
fi

echo
echo "Release："
echo "$RELEASE_URL"
echo