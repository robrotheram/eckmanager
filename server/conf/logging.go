package conf

import (
	"fmt"
	"io"
	"os"
	"strings"

	"github.com/sirupsen/logrus"
)

// LoggingConfig specifies all the parameters needed for logging
type LoggingConfig struct {
	Level string
	Dir   string
}

// ConfigureLogging will take the logging configuration and also adds
// a few default parameters
func ConfigureLogging(config *LoggingConfig) (*logrus.Logger, error) {
	hostname, err := os.Hostname()
	if err != nil {
		return nil, err
	}

	logger := logrus.StandardLogger()
	logger.WithField("hostname", hostname)

	// use a file if you want
	if config.Dir != "" {
		var file, errOpen = os.OpenFile(config.Dir+"/eckmanager.out", os.O_WRONLY|os.O_CREATE|os.O_APPEND, 0755)
		if errOpen != nil {
			fmt.Println("Could Not Open Log File : " + errOpen.Error())
		}
		if errOpen != nil {
			return nil, errOpen
		}
		mw := io.MultiWriter(os.Stdout, file)
		logrus.SetOutput(mw)
	}

	if config.Level != "" {
		level, err := logrus.ParseLevel(strings.ToUpper(config.Level))
		if err != nil {
			return nil, err
		}
		logger.SetLevel(level)
	}

	logger.SetFormatter(&logrus.TextFormatter{
		FullTimestamp:    true,
		DisableTimestamp: false,
	})
	// logger.SetReportCaller(true)

	return logger, nil
}
