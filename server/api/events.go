package api

type event struct {
	StatusCode int         `json:"status_code"`
	Mesassge   string      `json:"message"`
	Data       interface{} `json:"data,omitempty""`
}

var okEvent = event{StatusCode: 200, Mesassge: "Request Complete Successfully"}
