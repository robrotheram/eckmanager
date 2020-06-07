package audit

import (
	"github.com/sirupsen/logrus"
)

type ConsoleWriter struct {
	log *logrus.Logger
}

func (lw *ConsoleWriter) Setup() error {
	lw.log = logrus.New()
	return nil
}

func (lw *ConsoleWriter) Write(ae AuduitEvent) {

	lw.log.Infof("AUDIT %v:", ae)
}

func (lw *ConsoleWriter) Close() {
	return
}
