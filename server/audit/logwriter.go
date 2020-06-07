package audit

import (
	"encoding/json"
	"os"
)

type LogWriter struct {
	FilePath string
	file     *os.File
}

func (lw *LogWriter) Setup() error {
	file, err := os.OpenFile(lw.FilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, os.ModePerm)
	if err == nil {
		lw.file = file
	}
	return err
}

func (lw LogWriter) Close() {
	lw.file.Close()
}

func (lw *LogWriter) Write(ae AuduitEvent) {
	encoder := json.NewEncoder(lw.file)
	encoder.Encode(ae)
}
