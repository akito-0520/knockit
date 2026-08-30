// Package apikey はAPIキーの生成とハッシュ化を行う純粋関数を提供する。
package apikey

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
)

// Prefix は生成されるすべてのAPIキーの接頭辞。
const Prefix = "knk_"

// prefixLen は key_prefix として保存する先頭文字数（"knk_" + 8文字）。
const prefixLen = 12

// Generate は新しい生キーと、その SHA-256 ハッシュ（hex）、表示用の接頭辞を返す。
// 生キーは "knk_" + 32バイトの乱数を base64url（パディングなし）で符号化したもの。
func Generate() (raw, hash, keyPrefix string, err error) {
	buf := make([]byte, 32)
	if _, err = rand.Read(buf); err != nil {
		return "", "", "", fmt.Errorf("failed to generate random bytes: %w", err)
	}

	raw = Prefix + base64.RawURLEncoding.EncodeToString(buf)
	hash = Hash(raw)
	keyPrefix = raw[:prefixLen]
	return raw, hash, keyPrefix, nil
}

// Hash は生キーの SHA-256 ダイジェストを hex 文字列（64文字）で返す。
func Hash(raw string) string {
	sum := sha256.Sum256([]byte(raw))
	return hex.EncodeToString(sum[:])
}
