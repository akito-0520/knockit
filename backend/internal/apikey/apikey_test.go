package apikey

import (
	"regexp"
	"strings"
	"testing"
)

var hexRe = regexp.MustCompile(`^[0-9a-f]{64}$`)

func TestGenerate(t *testing.T) {
	raw, hash, prefix, err := Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	if !strings.HasPrefix(raw, Prefix) {
		t.Errorf("raw %q does not start with %q", raw, Prefix)
	}
	if !hexRe.MatchString(hash) {
		t.Errorf("hash %q is not 64 hex chars", hash)
	}
	if hash != Hash(raw) {
		t.Errorf("hash %q != Hash(raw) %q", hash, Hash(raw))
	}
	if prefix != raw[:12] {
		t.Errorf("prefix %q != first 12 chars of raw %q", prefix, raw[:12])
	}
}

func TestGenerateIsUnique(t *testing.T) {
	seen := make(map[string]struct{})
	for range 100 {
		raw, _, _, err := Generate()
		if err != nil {
			t.Fatalf("Generate() error: %v", err)
		}
		if _, dup := seen[raw]; dup {
			t.Fatalf("duplicate key generated: %q", raw)
		}
		seen[raw] = struct{}{}
	}
}

func TestHashIsDeterministic(t *testing.T) {
	raw, _, _, err := Generate()
	if err != nil {
		t.Fatalf("Generate() error: %v", err)
	}

	first := Hash(raw)
	second := Hash(raw)
	if first != second {
		t.Errorf("Hash not deterministic: %q vs %q", first, second)
	}
	if Hash("knk_a") == Hash("knk_b") {
		t.Error("different inputs produced the same hash")
	}
}
