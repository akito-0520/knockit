package validator

import (
	"net/mail"
	"regexp"
	"unicode/utf8"

	"github.com/akito-0520/knockit/internal/model"
)

var (
	usernameRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9-]*[a-z0-9]$`)
	UUIDRegex     = regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)
	colorRegex    = regexp.MustCompile(`^#[0-9a-fA-F]{6}$`)
)

func ValidateUserSetup(req model.UserSetupRequest) []model.ValidationError {
	var errs []model.ValidationError

	usernameLen := utf8.RuneCountInString(req.Username)
	if usernameLen < 3 || usernameLen > 30 {
		errs = append(errs, model.ValidationError{Field: "username", Message: "username must be between 3 and 30 characters"})
	}
	if !usernameRegex.MatchString(req.Username) {
		errs = append(errs, model.ValidationError{Field: "username", Message: "username must contain only lowercase letters, numbers, and hyphens (cannot start or end with a hyphen)"})
	}

	displayNameLen := utf8.RuneCountInString(req.DisplayName)
	if displayNameLen < 1 || displayNameLen > 100 {
		errs = append(errs, model.ValidationError{Field: "display_name", Message: "display name must be between 1 and 100 characters"})
	}

	return errs
}

func ValidateUserUpdate(req model.UserUpdateRequest) []model.ValidationError {
	var errs []model.ValidationError

	displayNameLen := utf8.RuneCountInString(req.DisplayName)
	if displayNameLen < 1 || displayNameLen > 100 {
		errs = append(errs, model.ValidationError{Field: "display_name", Message: "display name must be between 1 and 100 characters"})
	}

	return errs
}

func ValidateStatusUpdate(req model.StatusUpdateRequest) []model.ValidationError {
	var errs []model.ValidationError

	presetEmpty := req.PresetID == nil || *req.PresetID == ""

	if presetEmpty && req.CustomMessage == "" {
		errs = append(errs, model.ValidationError{Field: "request", Message: "either preset_id or custom_message is required"})
		return errs
	}

	if !presetEmpty && !UUIDRegex.MatchString(*req.PresetID) {
		errs = append(errs, model.ValidationError{Field: "preset_id", Message: "preset_id must be a valid UUID format"})
	}

	customMessageLen := utf8.RuneCountInString(req.CustomMessage)
	if customMessageLen > 200 {
		errs = append(errs, model.ValidationError{Field: "custom_message", Message: "custom message must be 200 characters or less"})
	}

	return errs
}

func ValidateUsername(username string) []model.ValidationError {
	var errs []model.ValidationError

	if !usernameRegex.MatchString(username) {
		errs = append(errs, model.ValidationError{Field: "username", Message: "invalid username format"})
	}

	return errs
}

func validatePresetFields(label, color string, displayOrder int) []model.ValidationError {
	var errs []model.ValidationError

	labelLen := utf8.RuneCountInString(label)
	if labelLen > 20 {
		errs = append(errs, model.ValidationError{Field: "label", Message: "label must be between 1 and 20 characters"})
	}

	if !IsValidColor(color) {
		errs = append(errs, model.ValidationError{Field: "color", Message: "color must be a valid hex color (e.g. #FF0000)"})
	}

	if displayOrder < 0 {
		errs = append(errs, model.ValidationError{Field: "display_order", Message: "display_order must be 0 or greater"})
	}

	return errs
}

func ValidateInquiryFields(req *model.CreateInquiryRequest) []model.ValidationError {
	var errs []model.ValidationError

	if !req.Category.Valid() {
		errs = append(errs, model.ValidationError{Field: "category", Message: "invalid category"})
	}

	bodyLen := utf8.RuneCountInString(req.Body)
	if bodyLen < 5 || bodyLen > 5000 {
		errs = append(errs, model.ValidationError{Field: "body", Message: "body must be between 5 and 5000 characters"})
	}

	if req.ReplyRequested {
		switch {
		case req.ReplyTo == nil || *req.ReplyTo == "":
			errs = append(errs, model.ValidationError{Field: "reply_to", Message: "reply to is required when reply requested"})
		case utf8.RuneCountInString(*req.ReplyTo) > 255:
			errs = append(errs, model.ValidationError{
				Field:   "reply_to",
				Message: "reply_to must be 255 characters or fewer",
			})
		case !isValidEmail(*req.ReplyTo):
			errs = append(errs, model.ValidationError{
				Field:   "reply_to",
				Message: "reply_to must be a valid email address",
			})

		}
	}
	return errs
}

func ValidateCreatePreset(req model.CreatePresetRequest) []model.ValidationError {
	return validatePresetFields(req.Label, req.Color, req.DisplayOrder)
}

func ValidateUpdatePreset(req model.UpdatePresetRequest) []model.ValidationError {
	return validatePresetFields(req.Label, req.Color, req.DisplayOrder)
}

func IsValidUUID(s string) bool {
	return UUIDRegex.MatchString(s)
}

func IsValidColor(s string) bool {
	return colorRegex.MatchString(s)
}

func isValidEmail(s string) bool {
	addr, err := mail.ParseAddress(s)
	if err != nil {
		return false
	}
	return addr.Address == s
}
