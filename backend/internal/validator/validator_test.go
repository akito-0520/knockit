package validator_test

import (
	"reflect"
	"sort"
	"strings"
	"testing"

	"github.com/akito-0520/knockit/internal/model"
	"github.com/akito-0520/knockit/internal/validator"
)

// ヘルパー関数

func strPtr(s string) *string {
	return &s
}

func TestValidateUserSetup(t *testing.T) {
	longUsername := strings.Repeat("a", 31)
	longDisplayName := strings.Repeat("あ", 101)

	tests := []struct {
		name         string
		req          model.UserSetupRequest
		wantErrCount int
		wantFields   []string
	}{
		{
			name: "正常系",
			req: model.UserSetupRequest{
				Username:    "aaa",
				DisplayName: "テストネーム",
			},
			wantErrCount: 0,
			wantFields:   nil,
		},
		{
			name: "異常系: usernameが短すぎる",
			req: model.UserSetupRequest{
				Username:    "aa",
				DisplayName: "テストネーム",
			},
			wantErrCount: 1,
			wantFields:   []string{"username"},
		},
		{
			name: "異常系: usernameが長すぎる",
			req: model.UserSetupRequest{
				Username:    longUsername,
				DisplayName: "テストネーム",
			},
			wantErrCount: 1,
			wantFields:   []string{"username"},
		},
		{
			name: "異常系: usernameが不正な型",
			req: model.UserSetupRequest{
				Username:    "test-name-",
				DisplayName: "テストネーム",
			},
			wantErrCount: 1,
			wantFields:   []string{"username"},
		},
		{
			name: "異常系: displayNameが空",
			req: model.UserSetupRequest{
				Username:    "test-name",
				DisplayName: "",
			},
			wantErrCount: 1,
			wantFields:   []string{"display_name"},
		},
		{
			name: "異常系: displayNameが長すぎる",
			req: model.UserSetupRequest{
				Username:    "test-name",
				DisplayName: longDisplayName,
			},
			wantErrCount: 1,
			wantFields:   []string{"display_name"},
		},
		{
			name: "異常系: 両方が空",
			req: model.UserSetupRequest{
				Username:    "",
				DisplayName: "",
			},
			wantErrCount: 3,
			wantFields:   []string{"username", "username", "display_name"},
		},
		{
			name: "異常系: 両方が長すぎる",
			req: model.UserSetupRequest{
				Username:    longUsername,
				DisplayName: longDisplayName,
			},
			wantErrCount: 2,
			wantFields:   []string{"username", "display_name"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := validator.ValidateUserSetup(tt.req)

			if len(errs) != tt.wantErrCount {
				t.Errorf("got %d errors, want %d, errs=%+v", len(errs), tt.wantErrCount, errs)
			}

			// Field の検証
			gotFields := make([]string, len(errs))
			for i, e := range errs {
				gotFields[i] = e.Field
			}
			sort.Strings(gotFields)

			wantFields := append([]string{}, tt.wantFields...)
			sort.Strings(wantFields)

			if !reflect.DeepEqual(gotFields, wantFields) {
				t.Errorf("got fields %v, want %v", gotFields, wantFields)
			}
		})
	}
}

func TestValidateUserUpdate(t *testing.T) {
	longDisplayName := strings.Repeat("a", 101)

	tests := []struct {
		name         string
		req          model.UserUpdateRequest
		wantErrCount int
		wantFields   []string
	}{
		{
			name: "正常系",
			req: model.UserUpdateRequest{
				DisplayName: "test",
			},
			wantErrCount: 0,
			wantFields:   nil,
		},
		{
			name: "異常系: displayName が空",
			req: model.UserUpdateRequest{
				DisplayName: "",
			},
			wantErrCount: 1,
			wantFields:   []string{"display_name"},
		},
		{
			name: "異常系: displayName が長すぎる",
			req: model.UserUpdateRequest{
				DisplayName: longDisplayName,
			},
			wantErrCount: 1,
			wantFields:   []string{"display_name"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := validator.ValidateUserUpdate(tt.req)

			if len(errs) != tt.wantErrCount {
				t.Errorf("got %d errors, want %d, errs=%+v", len(errs), tt.wantErrCount, errs)
			}

			// Fieldの検証
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

func TestValidateStatusUpdate(t *testing.T) {
	validUUID := "550e8400-e29b-41d4-a716-446655440000"
	longMessage := strings.Repeat("あ", 201) // 201文字

	tests := []struct {
		name         string
		req          model.StatusUpdateRequest
		wantErrCount int
		wantFields   []string
	}{
		{
			name: "正常系: preset のみ",
			req: model.StatusUpdateRequest{
				PresetID:      strPtr(validUUID),
				CustomMessage: "",
			},
			wantErrCount: 0,
			wantFields:   nil,
		},
		{
			name: "正常系: custom_message のみ",
			req: model.StatusUpdateRequest{
				PresetID:      nil,
				CustomMessage: "勉強中",
			},
			wantErrCount: 0,
			wantFields:   nil,
		},
		{
			name: "正常系: 両方指定",
			req: model.StatusUpdateRequest{
				PresetID:      strPtr(validUUID),
				CustomMessage: "勉強中",
			},
			wantErrCount: 0,
			wantFields:   nil,
		},
		{
			name: "異常系: 両方 nil / 空",
			req: model.StatusUpdateRequest{
				PresetID:      nil,
				CustomMessage: "",
			},
			wantErrCount: 1,
			wantFields:   []string{"request"},
		},
		{
			name: "異常系: preset が空文字列",
			req: model.StatusUpdateRequest{
				PresetID:      strPtr(""),
				CustomMessage: "",
			},
			wantErrCount: 1,
			wantFields:   []string{"request"},
		},
		{
			name: "異常系: preset が不正な UUID",
			req: model.StatusUpdateRequest{
				PresetID:      strPtr("not-a-uuid"),
				CustomMessage: "",
			},
			wantErrCount: 1,
			wantFields:   []string{"preset_id"},
		},
		{
			name: "異常系: custom_message が長すぎる",
			req: model.StatusUpdateRequest{
				PresetID:      nil,
				CustomMessage: longMessage,
			},
			wantErrCount: 1,
			wantFields:   []string{"custom_message"},
		},
		{
			name: "異常系: preset が不正 + custom_message が長すぎる",
			req: model.StatusUpdateRequest{
				PresetID:      strPtr("not-a-uuid"),
				CustomMessage: longMessage,
			},
			wantErrCount: 2,
			wantFields:   []string{"preset_id", "custom_message"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := validator.ValidateStatusUpdate(tt.req)

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

func TestValidateUsername(t *testing.T) {
	tests := []struct {
		name         string
		username     string
		wantErrCount int
		wantFields   []string
	}{
		{
			name:         "正常系",
			username:     "test-name",
			wantErrCount: 0,
			wantFields:   nil,
		},
		{
			name:         "異常系: username の前のフォーマットが不正",
			username:     "-test",
			wantErrCount: 1,
			wantFields:   []string{"username"},
		},
		{
			name:         "異常系: username の後ろのフォーマットが不正",
			username:     "test-",
			wantErrCount: 1,
			wantFields:   []string{"username"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := validator.ValidateUsername(tt.username)

			if len(errs) != tt.wantErrCount {
				t.Errorf("got %d, want %d, errs=%+v", len(errs), tt.wantErrCount, errs)
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

func TestValidateCreatePreset(t *testing.T) {
	longLabel := strings.Repeat("a", 21)

	tests := []struct {
		name         string
		req          model.CreatePresetRequest
		wantErrCount int
		wantFields   []string
	}{
		{
			name: "正常系",
			req: model.CreatePresetRequest{
				Label:        "aaaa",
				Color:        "#FFFFFF",
				DisplayOrder: 0,
			},
			wantErrCount: 0,
			wantFields:   nil,
		},
		{
			name: "異常系: labelが長すぎる",
			req: model.CreatePresetRequest{
				Label:        longLabel,
				Color:        "#FFFFFF",
				DisplayOrder: 0,
			},
			wantErrCount: 1,
			wantFields:   []string{"label"},
		},
		{
			name: "異常系: colorの不正フォーマット",
			req: model.CreatePresetRequest{
				Label:        "aaaaaa",
				Color:        "FFFFFF",
				DisplayOrder: 0,
			},
			wantErrCount: 1,
			wantFields:   []string{"color"},
		},
		{
			name: "異常系: display orderが負の数",
			req: model.CreatePresetRequest{
				Label:        "aaaaaa",
				Color:        "#FFFFFF",
				DisplayOrder: -1,
			},
			wantErrCount: 1,
			wantFields:   []string{"display_order"},
		},
		{
			name: "異常系: 全てが不正",
			req: model.CreatePresetRequest{
				Label:        longLabel,
				Color:        "FFFFFF",
				DisplayOrder: -1,
			},
			wantErrCount: 3,
			wantFields:   []string{"label", "color", "display_order"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := validator.ValidateCreatePreset(tt.req)

			if len(errs) != tt.wantErrCount {
				t.Errorf("got %d, want %d, errs=%+v", len(errs), tt.wantErrCount, errs)
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

func TestValidateUpdatePreset(t *testing.T) {
	longLabel := strings.Repeat("a", 21)

	tests := []struct {
		name         string
		req          model.CreatePresetRequest
		wantErrCount int
		wantFields   []string
	}{
		{
			name: "正常系",
			req: model.CreatePresetRequest{
				Label:        "aaaa",
				Color:        "#FFFFFF",
				DisplayOrder: 0,
			},
			wantErrCount: 0,
			wantFields:   nil,
		},
		{
			name: "異常系: labelが長すぎる",
			req: model.CreatePresetRequest{
				Label:        longLabel,
				Color:        "#FFFFFF",
				DisplayOrder: 0,
			},
			wantErrCount: 1,
			wantFields:   []string{"label"},
		},
		{
			name: "異常系: colorの不正フォーマット",
			req: model.CreatePresetRequest{
				Label:        "aaaaaa",
				Color:        "FFFFFF",
				DisplayOrder: 0,
			},
			wantErrCount: 1,
			wantFields:   []string{"color"},
		},
		{
			name: "異常系: display orderが負の数",
			req: model.CreatePresetRequest{
				Label:        "aaaaaa",
				Color:        "#FFFFFF",
				DisplayOrder: -1,
			},
			wantErrCount: 1,
			wantFields:   []string{"display_order"},
		},
		{
			name: "異常系: 全てが不正",
			req: model.CreatePresetRequest{
				Label:        longLabel,
				Color:        "FFFFFF",
				DisplayOrder: -1,
			},
			wantErrCount: 3,
			wantFields:   []string{"label", "color", "display_order"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			errs := validator.ValidateCreatePreset(tt.req)

			if len(errs) != tt.wantErrCount {
				t.Errorf("got %d, want %d, errs=%+v", len(errs), tt.wantErrCount, errs)
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
