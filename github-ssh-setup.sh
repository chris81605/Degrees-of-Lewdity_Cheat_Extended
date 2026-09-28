#!/data/data/com.termux/files/usr/bin/bash
set -e

KEY="$HOME/.ssh/id_ed25519"
PUB="$KEY.pub"

echo "========================================"
echo " GitHub SSH Setup for Termux"
echo "========================================"

# Dependencies
for cmd in git ssh-keygen; do
    if ! command -v "$cmd" >/dev/null 2>&1; then
        echo "Installing git/openssh..."
        pkg install -y git openssh
        break
    fi
done

mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [ -f "$KEY" ]; then
    echo "✓ Existing SSH key found: $KEY"
else
    echo "Generating Ed25519 SSH key..."
    ssh-keygen -t ed25519 -f "$KEY" -N "" -q
    chmod 600 "$KEY"
    chmod 644 "$PUB"
    echo "✓ SSH key created."
fi

if [ ! -f "$PUB" ]; then
    echo "❌ Public key not found: $PUB"
    exit 1
fi

echo
echo "========== PUBLIC KEY =========="
cat "$PUB"
echo
echo "================================"

if command -v termux-clipboard-set >/dev/null 2>&1; then
    if termux-clipboard-set < "$PUB"; then
        echo "✓ Public key copied to Android clipboard."
    else
        echo "⚠ termux-clipboard-set exists but clipboard copy failed."
    fi
else
    echo "ℹ Termux:API clipboard command not found; copy the key manually."
fi

echo
echo "Next:"
echo "1. Open https://github.com/settings/keys"
echo "2. New SSH key"
echo "3. Title: Termux"
echo "4. Key type: Authentication Key"
echo "5. Paste the public key and save"
echo "6. Then run: ssh -T git@github.com"
