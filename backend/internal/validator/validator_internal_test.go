package validator

import (
	"reflect"
	"sort"
	"strings"
	"testing"
)

func TestIsValidColor(t *testing.T) {
	tests := []struct {
		name  string
		input string
		want  bool
	}{
		{"正常系: 赤", "#FF0000", true},
		{"正常系: 小文字", "#ff00ff", true},
		{"異常系: 英字の色名", "red", false},
		{"異常系: #が無い", "FF0000", false},
		{"異常系: 文字数不足", "#FFF", false},
		{"異常系: 文字数オーバー", "#FFF0000", false},
		{"異常系: 空文字", "", false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := isValidColor(tt.input)

			if got != tt.want {
				t.Errorf("IsValidColor(%q = %v), want: %v", tt.input, got, tt.want)
			}
		})
	}
}

func TestValidatePresetFields(t *testing.T) {
	validLabel := strings.Repeat("a", 21)

	tests := []struct {
		name          string
		label         string
		color         string
		display_Order int
		wantErrCount  int
		wantFields    []string
	}{
		{
			name:          "正常系",
			label:         "aaaaa",
			color:         "#FFFFFF",
			display_Order: 0,
			wantErrCount:  0,
			wantFields:    nil,
		},
		{
			name:          "異常系: label が長すぎる",
			label:         validLabel,
			color:         "#FFFFFF",
			display_Order: 0,
			wantErrCount:  1,
			wantFields:    []string{"label"},
		},
		{
			name:          "異常系: color が不正",
			label:         "aaaaaa",
			color:         "FFFFFF",
			display_Order: 0,
			wantErrCount:  1,
			wantFields:    []string{"color"},
		},
		{
			name:          "異常系: display が 負の値",
			label:         "aaaaaa",
			color:         "#FFFFFF",
			display_Order: -1,
			wantErrCount:  1,
			wantFields:    []string{"display_order"},
		},
		{
			name:          "異常系: 全部不正",
			label:         validLabel,
			color:         "FFFFFF",
			display_Order: -1,
			wantErrCount:  3,
			wantFields:    []string{"label", "color", "display_order"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := validatePresetFields(tt.label, tt.color, tt.display_Order)

			if len(errs) != tt.wantErrCount {
				t.Errorf("got %d errors, want %d, errs=%+v", len(errs), tt.wantErrCount, errs)
			}

			// Field の検証
			gotFields := make([]string, len(errs))
			for i, e := range errs {
				gotFields[i] = e.Field
			}

			sort.Strings(gotFields)

			wantFields := append([]string{}, tt.wantFields...) // 元を壊さないように
			sort.Strings(wantFields)

			if !reflect.DeepEqual(gotFields, wantFields) {
				t.Errorf("got fields %v, want %v", gotFields, wantFields)
			}
		})
	}
}
